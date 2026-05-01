import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users, notificationSchedules, tasks, notificationLogs } from '$lib/db/schema';
import { requireAdmin, requireAuth } from '$lib/auth/jwt';
import { zUpdateUser, zUpdateNotificationSchedule } from '$lib/types';
import { eq, or, count } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	const { id } = event.params;

	if (auth.role !== 'admin' && auth.userId !== id) throw error(403, 'Forbidden');

	const [user] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			telegramChatId: users.telegramChatId,
			avatarUrl: users.avatarUrl,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users)
		.where(eq(users.id, id))
		.limit(1);

	if (!user) throw error(404, 'User not found');
	return json(user);
};

export const PATCH: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	const { id } = event.params;

	if (auth.role !== 'admin' && auth.userId !== id) throw error(403, 'Forbidden');

	const body = await event.request.json().catch(() => null);

	const userParsed = zUpdateUser.safeParse(body);
	if (!userParsed.success) throw error(400, JSON.stringify(userParsed.error.flatten()));

	const { role, ...userFields } = userParsed.data;
	const updates: Partial<typeof userFields & { role: 'admin' | 'member' }> = { ...userFields };

	if (role !== undefined) {
		if (auth.role !== 'admin') throw error(403, 'Only admins can change roles');
		updates.role = role;
	}

	if (Object.keys(updates).length === 0) throw error(400, 'No fields to update');

	const [updated] = await db
		.update(users)
		.set(updates)
		.where(eq(users.id, id))
		.returning({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role
		});

	if (!updated) throw error(404, 'User not found');
	return json(updated);
};

export const DELETE: RequestHandler = async (event) => {
	await requireAdmin(event);
	const { id } = event.params;

	const [{ taskCount }] = await db
		.select({ taskCount: count() })
		.from(tasks)
		.where(or(eq(tasks.assignedTo, id), eq(tasks.createdBy, id)));

	if (taskCount > 0)
		throw error(409, `Cannot delete: member has ${taskCount} task${taskCount === 1 ? '' : 's'}. Reassign or delete them first.`);

	await db.delete(notificationLogs).where(eq(notificationLogs.userId, id));
	await db.delete(notificationSchedules).where(eq(notificationSchedules.userId, id));
	const [deleted] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });

	if (!deleted) throw error(404, 'User not found');
	return json({ ok: true });
};
