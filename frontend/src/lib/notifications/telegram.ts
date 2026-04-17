import type { Task, User } from '$lib/db/schema';
import { TELEGRAM_BOT_TOKEN } from '$env/static/private';

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

export async function sendReminderTelegram(
	user: Pick<User, 'telegramChatId' | 'name'>,
	task: Pick<Task, 'title'>,
	daysUntilDeadline: number
): Promise<void> {
	if (!user.telegramChatId) return;

	const when =
		daysUntilDeadline === 0
			? 'today'
			: daysUntilDeadline === 1
				? 'tomorrow'
				: `in ${daysUntilDeadline} days`;

	await sendMessage(
		user.telegramChatId,
		`⏰ <b>Task reminder</b>\n\nHi ${user.name}, your task <b>${task.title}</b> is due <b>${when}</b>.\n\nPlease make sure to complete it on time.`
	);
}

export async function sendReportTelegram(
	user: Pick<User, 'telegramChatId' | 'name'>,
	taskTokens: { task: Pick<Task, 'title'>; token: string }[],
	appUrl: string
): Promise<void> {
	if (!user.telegramChatId) return;

	const taskLines = taskTokens
		.map(({ task, token }, i) => {
			const base = `${appUrl}/confirm/${token}`;
			return [
				`<b>${i + 1}. ${task.title}</b>`,
				`<a href="${base}?status=done">✅ Done</a> · <a href="${base}?status=in_progress">🔄 In Progress</a> · <a href="${base}?status=problem">⚠️ Problem</a>`
			].join('\n');
		})
		.join('\n\n');

	await sendMessage(
		user.telegramChatId,
		`📋 <b>Status update requested</b>\n\nHi ${user.name}, please update the status of your tasks:\n\n${taskLines}`
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
				? new Date(t.deadlineDate).toLocaleDateString('en-GB', {
						day: '2-digit',
						month: 'short',
						year: 'numeric'
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
