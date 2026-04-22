import { db } from '$lib/db';
import { tasks, users, notificationSchedules, notificationLogs } from '$lib/db/schema';
import { eq, ne, and, gte } from 'drizzle-orm';
import { computeNextDeadline, daysBetween } from './deadline';
import { sendReminderEmail } from '$lib/notifications/email';
import { sendReminderTelegram } from '$lib/notifications/telegram';

type ReminderEntry = { taskId: string; title: string; daysUntil: number; deadlineDate: Date | null };

type UserGroup = {
	user: { id: string; email: string; name: string; telegramChatId: string | null };
	channel: 'email' | 'telegram' | 'both';
	reminders: ReminderEntry[];
};

function startOfToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

export async function processReminders(): Promise<void> {
	const today = startOfToday();
	const now = new Date();

	const activeTasks = await db
		.select({
			task: tasks,
			user: { id: users.id, email: users.email, name: users.name, telegramChatId: users.telegramChatId },
			schedule: notificationSchedules
		})
		.from(tasks)
		.innerJoin(users, eq(tasks.assignedTo, users.id))
		.leftJoin(notificationSchedules, eq(notificationSchedules.userId, users.id))
		.where(ne(tasks.status, 'done'));

	const byUser = new Map<string, UserGroup>();

	for (const { task, user, schedule } of activeTasks) {
		if (!schedule) continue;

		const deadline = computeNextDeadline(task, now);
		if (!deadline) continue;

		const daysUntil = daysBetween(now, deadline);
		const reminderDays: number[] = Array.isArray(schedule.reminderDaysBefore)
			? schedule.reminderDaysBefore
			: [2, 1, 0];

		if (!reminderDays.includes(daysUntil)) continue;

		const reminderHour = parseInt(schedule.reportTime.split(':')[0], 10);
		if (now.getHours() < reminderHour) continue;

		const alreadySent = await db
			.select({ id: notificationLogs.id })
			.from(notificationLogs)
			.where(
				and(
					eq(notificationLogs.taskId, task.id),
					eq(notificationLogs.type, 'reminder'),
					gte(notificationLogs.sentAt, today)
				)
			)
			.limit(1);

		if (alreadySent.length > 0) continue;

		if (!byUser.has(user.id)) {
			byUser.set(user.id, { user, channel: schedule.reminderChannel, reminders: [] });
		}
		byUser.get(user.id)!.reminders.push({ taskId: task.id, title: task.title, daysUntil, deadlineDate: task.deadlineDate });
	}

	for (const { user, channel, reminders } of byUser.values()) {
		if (channel === 'email' || channel === 'both') {
			await sendReminderEmail(user, reminders);
			for (const r of reminders) {
				await db.insert(notificationLogs).values({ userId: user.id, taskId: r.taskId, type: 'reminder', channel: 'email' });
			}
		}
		if ((channel === 'telegram' || channel === 'both') && user.telegramChatId) {
			await sendReminderTelegram(user, reminders);
			for (const r of reminders) {
				await db.insert(notificationLogs).values({ userId: user.id, taskId: r.taskId, type: 'reminder', channel: 'telegram' });
			}
		}
	}
}
