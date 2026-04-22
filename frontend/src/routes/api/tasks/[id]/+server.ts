import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { tasks, statusTokens, users, notificationSchedules } from '$lib/db/schema';
import { requireAuth } from '$lib/auth/jwt';
import { zUpdateTask } from '$lib/types';
import { eq } from 'drizzle-orm';
import { sendDeletionEmail } from '$lib/notifications/email';
import { sendDeletionTelegram } from '$lib/notifications/telegram';
import { addDays } from '$lib/utils';

export const GET: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	const { id } = event.params;

	const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
	if (!task) throw error(404, 'Task not found');

	if (auth.role !== 'admin' && task.assignedTo !== auth.userId) throw error(403, 'Forbidden');

	return json(task);
};

export const PATCH: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	const { id } = event.params;

	const [existing] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
	if (!existing) throw error(404, 'Task not found');

	if (auth.role !== 'admin' && existing.assignedTo !== auth.userId) throw error(403, 'Forbidden');

	const body = await event.request.json().catch(() => null);
	const parsed = zUpdateTask.safeParse(body);
	if (!parsed.success) throw error(400, JSON.stringify(parsed.error.flatten()));

	const { deadlineDate, ...rest } = parsed.data;
	const updates = {
		...rest,
		...(deadlineDate !== undefined ? { deadlineDate: deadlineDate ? new Date(deadlineDate) : null } : {}),
		updatedAt: new Date()
	};

	if (Object.keys(updates).length === 1) throw error(400, 'No fields to update');

	const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
	return json(updated);
};

export const DELETE: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	if (auth.role !== 'admin') throw error(403, 'Only managers can delete tasks');

	const { id } = event.params;

	const [row] = await db
		.select({
			task: { title: tasks.title },
			user: { id: users.id, email: users.email, name: users.name, telegramChatId: users.telegramChatId },
			schedule: { reminderChannel: notificationSchedules.reminderChannel }
		})
		.from(tasks)
		.innerJoin(users, eq(tasks.assignedTo, users.id))
		.leftJoin(notificationSchedules, eq(notificationSchedules.userId, users.id))
		.where(eq(tasks.id, id))
		.limit(1);

	if (!row) throw error(404, 'Task not found');

	await db.delete(statusTokens).where(eq(statusTokens.taskId, id));
	await db.delete(tasks).where(eq(tasks.id, id));

	const channel = row.schedule?.reminderChannel ?? 'email';
	if (channel === 'email' || channel === 'both') {
		await sendDeletionEmail(row.user, row.task.title).catch((err) =>
			console.error('sendDeletionEmail failed:', err)
		);
	}
	if ((channel === 'telegram' || channel === 'both') && row.user.telegramChatId) {
		await sendDeletionTelegram(row.user, row.task.title).catch((err) =>
			console.error('sendDeletionTelegram failed:', err)
		);
	}

	return json({ ok: true });
};

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	if (auth.role !== 'admin') throw error(403, 'Only managers can generate tokens');

	const { id } = event.params;
	const [task] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
	if (!task) throw error(404, 'Task not found');

	const expiresAt = addDays(new Date(), 7);
	const [token] = await db.insert(statusTokens).values({ taskId: id, expiresAt }).returning();

	return json(token, { status: 201 });
};
