import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sendMessage } from '$lib/notifications/telegram';

export const POST: RequestHandler = async ({ request }) => {
	const update = await request.json().catch(() => null);
	if (!update) return json({ ok: true });

	const text: string = update.message?.text ?? '';
	const chatId: string = String(update.message?.chat?.id ?? '');
	const firstName: string = update.message?.from?.first_name ?? '';

	if (!chatId || !text.startsWith('/start')) return json({ ok: true });

	const token = text.slice('/start'.length).trim();

	if (!token) {
		await sendMessage(chatId, `👋 Hi ${firstName}! To connect your account, use the link provided by your manager in TaskFlow.`);
		return json({ ok: true });
	}

	const [user] = await db
		.select()
		.from(users)
		.where(
			and(
				eq(users.telegramLinkToken, token),
				gt(users.telegramLinkExpiresAt, new Date())
			)
		)
		.limit(1);

	if (!user) {
		await sendMessage(chatId, '❌ This link is invalid or has expired. Please ask your manager to generate a new one.');
		return json({ ok: true });
	}

	await db
		.update(users)
		.set({ telegramChatId: chatId, telegramLinkToken: null, telegramLinkExpiresAt: null })
		.where(eq(users.id, user.id));

	await sendMessage(chatId, `✅ Connected! Hi ${user.name}, you'll now receive TaskFlow notifications here.`);

	return json({ ok: true });
};
