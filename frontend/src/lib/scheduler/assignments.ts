import { db } from '$lib/db';
import { tasks, users, notificationSchedules } from '$lib/db/schema';
import { eq, isNull, inArray } from 'drizzle-orm';
import { sendAssignmentEmail } from '$lib/notifications/email';
import { sendAssignmentTelegram } from '$lib/notifications/telegram';
import { APP_URL } from '$lib/env';

type TaskEntry = { id: string; title: string; deadlineDate: Date | null };

type AssigneeGroup = {
	user: { id: string; email: string; name: string; telegramChatId: string | null };
	taskList: TaskEntry[];
	channel: 'email' | 'telegram' | 'both';
};

export async function processAssignmentNotifications(): Promise<void> {
	const unnotified = await db
		.select({
			task: { id: tasks.id, title: tasks.title, deadlineDate: tasks.deadlineDate },
			user: { id: users.id, email: users.email, name: users.name, telegramChatId: users.telegramChatId },
			schedule: { reminderChannel: notificationSchedules.reminderChannel }
		})
		.from(tasks)
		.innerJoin(users, eq(tasks.assignedTo, users.id))
		.leftJoin(notificationSchedules, eq(notificationSchedules.userId, users.id))
		.where(isNull(tasks.assignedNotifiedAt));

	if (unnotified.length === 0) return;

	const byUser = new Map<string, AssigneeGroup>();

	for (const { task, user, schedule } of unnotified) {
		if (!byUser.has(user.id)) {
			byUser.set(user.id, {
				user,
				taskList: [],
				channel: schedule?.reminderChannel ?? 'email'
			});
		}
		byUser.get(user.id)!.taskList.push(task);
	}

	const now = new Date();

	for (const { user, taskList, channel } of byUser.values()) {
		if (channel === 'email' || channel === 'both') {
			await sendAssignmentEmail(user, taskList, APP_URL);
		}
		if ((channel === 'telegram' || channel === 'both') && user.telegramChatId) {
			await sendAssignmentTelegram(user, taskList, APP_URL);
		}

		await db
			.update(tasks)
			.set({ assignedNotifiedAt: now })
			.where(inArray(tasks.id, taskList.map((t) => t.id)));
	}
}
