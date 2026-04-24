import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users, statusTokens, tasks } from '$lib/db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { sendMessage, answerCallbackQuery, editMessageText } from '$lib/notifications/telegram';

const VALID_STATUSES = ['done', 'in_progress', 'problem'] as const;
type ConfirmStatus = (typeof VALID_STATUSES)[number];

const statusDisplay: Record<ConfirmStatus, string> = {
	done: '✅ Done',
	in_progress: '🔄 In Progress',
	problem: '⚠️ Problem'
};

function isConfirmStatus(s: string): s is ConfirmStatus {
	return VALID_STATUSES.includes(s as ConfirmStatus);
}

async function handleCallbackQuery(cq: {
	id: string;
	data?: string;
	message?: { chat: { id: number }; message_id: number };
}): Promise<void> {
	const callbackQueryId = cq.id;

	try {
		const chatId = String(cq.message?.chat?.id ?? '');
		const messageId = cq.message?.message_id;
		const data = cq.data ?? '';

		const parts = data.split(':');
		if (parts[0] !== 'confirm' || parts.length !== 3) {
			await answerCallbackQuery(callbackQueryId);
			return;
		}

		const [, token, rawStatus] = parts;

		if (!isConfirmStatus(rawStatus)) {
			await answerCallbackQuery(callbackQueryId);
			return;
		}

		const [tokenRow] = await db
			.select()
			.from(statusTokens)
			.where(
				and(
					eq(statusTokens.token, token),
					isNull(statusTokens.usedAt),
					gt(statusTokens.expiresAt, new Date())
				)
			)
			.limit(1);

		if (!tokenRow) {
			await answerCallbackQuery(callbackQueryId, 'Link expired or already used.');
			return;
		}

		const [task] = await db
			.select({ title: tasks.title })
			.from(tasks)
			.where(eq(tasks.id, tokenRow.taskId))
			.limit(1);

		await db
			.update(tasks)
			.set({ status: rawStatus, updatedAt: new Date() })
			.where(eq(tasks.id, tokenRow.taskId));

		await db
			.update(statusTokens)
			.set({ usedAt: new Date() })
			.where(eq(statusTokens.token, token));

		const label = statusDisplay[rawStatus];

		await answerCallbackQuery(callbackQueryId, label);

		if (chatId && messageId) {
			await editMessageText(
				chatId,
				messageId,
				`${label} — <b>${task?.title ?? 'Task'}</b>`
			).catch(() => {});
		}
	} catch (e) {
		console.error('handleCallbackQuery error:', e);
		await answerCallbackQuery(callbackQueryId).catch(() => {});
	}
}

export const POST: RequestHandler = async ({ request }) => {
	const update = await request.json().catch(() => null);
	if (!update) return json({ ok: true });

	if (update.callback_query) {
		await handleCallbackQuery(update.callback_query);
		return json({ ok: true });
	}

	const text: string = update.message?.text ?? '';
	const chatId: string = String(update.message?.chat?.id ?? '');
	const firstName: string = update.message?.from?.first_name ?? '';

	if (!chatId || !text.startsWith('/start')) return json({ ok: true });

	const token = text.slice('/start'.length).trim();

	if (!token) {
		await sendMessage(
			chatId,
			`👋 Hi ${firstName}! To connect your account, use the link provided by your manager in TaskFlow.`
		);
		return json({ ok: true });
	}

	const [user] = await db
		.select()
		.from(users)
		.where(and(eq(users.telegramLinkToken, token), gt(users.telegramLinkExpiresAt, new Date())))
		.limit(1);

	if (!user) {
		await sendMessage(
			chatId,
			'❌ This link is invalid or has expired. Please ask your manager to generate a new one.'
		);
		return json({ ok: true });
	}

	await db
		.update(users)
		.set({ telegramChatId: chatId, telegramLinkToken: null, telegramLinkExpiresAt: null })
		.where(eq(users.id, user.id));

	await sendMessage(
		chatId,
		`✅ Connected! Hi ${user.name}, you'll now receive TaskFlow notifications here.`
	);

	return json({ ok: true });
};
