import { db } from '$lib/db';
import { tasks, users, notificationSchedules, notificationLogs } from '$lib/db/schema';
import { eq, ne, and, gte, isNotNull } from 'drizzle-orm';
import { computeNextDeadline, daysBetween } from './deadline';
import { sendReminderEmail } from '$lib/notifications/email';
import { sendReminderTelegram } from '$lib/notifications/telegram';

function startOfToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

export async function processReminders(): Promise<void> {
	const today = startOfToday();
	const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
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

	for (const { task, user, schedule } of activeTasks) {
		if (!schedule) continue;

		const deadline = computeNextDeadline(task, now);
		if (!deadline) continue;

		const daysUntil = daysBetween(now, deadline);
		const reminderDays: number[] = Array.isArray(schedule.reminderDaysBefore)
			? schedule.reminderDaysBefore
			: [2, 1, 0];

		if (!reminderDays.includes(daysUntil)) continue;

		const alreadySent = await db
			.select({ id: notificationLogs.id })
			.from(notificationLogs)
			.where(
				and(
					eq(notificationLogs.userId, user.id),
					eq(notificationLogs.taskId, task.id),
					eq(notificationLogs.type, 'reminder'),
					gte(notificationLogs.sentAt, today)
				)
			)
			.limit(1);

		if (alreadySent.length > 0) continue;

		const channel = schedule.reminderChannel;

		if (channel === 'email' || channel === 'both') {
			await sendReminderEmail(user, task, daysUntil);
			await db.insert(notificationLogs).values({
				userId: user.id,
				taskId: task.id,
				type: 'reminder',
				channel: 'email'
			});
		}

		if (channel === 'telegram' || channel === 'both') {
			await sendReminderTelegram(user, task, daysUntil);
			await db.insert(notificationLogs).values({
				userId: user.id,
				taskId: task.id,
				type: 'reminder',
				channel: 'telegram'
			});
		}
	}
}
