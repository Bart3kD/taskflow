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
