import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { tasks, users, notificationSchedules } from '$lib/db/schema';
import { requireAuth } from '$lib/auth/jwt';
import { zCreateTask } from '$lib/types';
import { eq } from 'drizzle-orm';
import { sendAssignmentEmail } from '$lib/notifications/email';
import { sendAssignmentTelegram } from '$lib/notifications/telegram';
import { APP_URL } from '$lib/env';

export const GET: RequestHandler = async (event) => {
	const auth = await requireAuth(event);

	const rows =
		auth.role === 'admin'
			? await db.select().from(tasks)
			: await db.select().from(tasks).where(eq(tasks.assignedTo, auth.userId));

	return json(rows);
};

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	if (auth.role !== 'admin') throw error(403, 'Only managers can create tasks');

	const body = await event.request.json().catch(() => null);
	const parsed = zCreateTask.safeParse(body);
	if (!parsed.success) throw error(400, JSON.stringify(parsed.error.flatten()));

	const { deadlineDate, ...rest } = parsed.data;

	const now = new Date();
	const [task] = await db
		.insert(tasks)
		.values({
			...rest,
			createdBy: auth.userId,
			deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined,
			assignedNotifiedAt: now
		})
		.returning();

	const [row] = await db
		.select({
			user: { id: users.id, email: users.email, name: users.name, telegramChatId: users.telegramChatId },
			schedule: { reminderChannel: notificationSchedules.reminderChannel }
		})
		.from(users)
		.leftJoin(notificationSchedules, eq(notificationSchedules.userId, users.id))
		.where(eq(users.id, task.assignedTo))
		.limit(1);

	if (row) {
		const channel = row.schedule?.reminderChannel ?? 'email';
		const taskEntry = [{ title: task.title, deadlineDate: task.deadlineDate }];
		if (channel === 'email' || channel === 'both') {
			await sendAssignmentEmail(row.user, taskEntry, APP_URL).catch((err) =>
				console.error('sendAssignmentEmail failed:', err)
			);
		}
		if ((channel === 'telegram' || channel === 'both') && row.user.telegramChatId) {
			await sendAssignmentTelegram(row.user, taskEntry, APP_URL).catch((err) =>
				console.error('sendAssignmentTelegram failed:', err)
			);
		}
	}

	return json(task, { status: 201 });
};
