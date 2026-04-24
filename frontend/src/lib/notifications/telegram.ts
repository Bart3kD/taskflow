import type { Task, User } from '$lib/db/schema';
import { TELEGRAM_BOT_TOKEN } from '$env/static/private';

type InlineKeyboard = Array<Array<{ text: string; callback_data: string }>>;

export async function sendMessage(chatId: string, text: string): Promise<void> {
	await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			disable_web_page_preview: true
		})
	});
}

async function sendMessageWithButtons(
	chatId: string,
	text: string,
	keyboard: InlineKeyboard
): Promise<void> {
	await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'HTML',
			reply_markup: { inline_keyboard: keyboard }
		})
	});
}

export async function answerCallbackQuery(id: string, text?: string): Promise<void> {
	await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ callback_query_id: id, text: text ?? '' })
	});
}

export async function editMessageText(
	chatId: string,
	messageId: number,
	text: string
): Promise<void> {
	await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			message_id: messageId,
			text,
			parse_mode: 'HTML',
			reply_markup: { inline_keyboard: [] }
		})
	});
}

function daysUntilLabel(days: number): string {
	if (days === 0) return 'today';
	if (days === 1) return 'tomorrow';
	return `in ${days} days`;
}

export async function sendReminderTelegram(
	user: Pick<User, 'telegramChatId' | 'name'>,
	reminders: { title: string; daysUntil: number; deadlineDate: Date | null }[]
): Promise<void> {
	if (!user.telegramChatId) return;

	const lines = reminders
		.map((r) => {
			const time = r.deadlineDate
				? new Date(r.deadlineDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
				: null;
			const due = time ? `${daysUntilLabel(r.daysUntil)} at ${time}` : daysUntilLabel(r.daysUntil);
			return `• <b>${r.title}</b> — due ${due}`;
		})
		.join('\n');

	await sendMessage(
		user.telegramChatId,
		`⏰ <b>Task reminders</b>\n\nHi ${user.name},\n\n${lines}\n\nPlease make sure to complete them on time.`
	);
}

export async function sendReportTelegram(
	user: Pick<User, 'telegramChatId' | 'name'>,
	taskTokens: { task: Pick<Task, 'title'>; token: string }[]
): Promise<void> {
	if (!user.telegramChatId) return;

	const intro =
		taskTokens.length === 1
			? `📋 <b>Status update requested</b>\n\nHi ${user.name}, please update the status of your task:`
			: `📋 <b>Status update requested</b>\n\nHi ${user.name}, please update the status of your tasks:`;

	await sendMessage(user.telegramChatId, intro);

	for (const { task, token } of taskTokens) {
		await sendMessageWithButtons(user.telegramChatId, `<b>${task.title}</b>`, [
			[
				{ text: '✅ Done', callback_data: `confirm:${token}:done` },
				{ text: '🔄 In Progress', callback_data: `confirm:${token}:in_progress` },
				{ text: '⚠️ Problem', callback_data: `confirm:${token}:problem` }
			]
		]);
	}
}

export async function sendDeletionTelegram(
	user: Pick<User, 'telegramChatId' | 'name'>,
	taskTitle: string
): Promise<void> {
	if (!user.telegramChatId) return;

	await sendMessage(
		user.telegramChatId,
		`🗑 <b>Task removed</b>\n\nHi ${user.name}, your task <b>${taskTitle}</b> has been removed by the manager.`
	);
}

export async function sendAssignmentTelegram(
	user: Pick<User, 'telegramChatId' | 'name'>,
	tasks: Pick<Task, 'title' | 'deadlineDate'>[],
	appUrl: string
): Promise<void> {
	if (!user.telegramChatId) return;

	const taskLines = tasks
		.map((t) => {
			const deadline = t.deadlineDate
				? new Date(t.deadlineDate).toLocaleString('en-GB', {
						day: '2-digit',
						month: 'short',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})
				: 'no deadline';
			return `• <b>${t.title}</b> — ${deadline}`;
		})
		.join('\n');

	const isSingle = tasks.length === 1;
	await sendMessage(
		user.telegramChatId,
		`📌 <b>${isSingle ? 'New task assigned' : 'New tasks assigned'}</b>\n\nHi ${user.name}, you have been assigned:\n\n${taskLines}\n\n<a href="${appUrl}/tasks">View your tasks</a>`
	);
}
