import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { notificationSchedules } from '$lib/db/schema';
import { requireAdmin } from '$lib/auth/jwt';
import { zUpdateNotificationSchedule } from '$lib/types';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async (event) => {
	await requireAdmin(event);
	const { id } = event.params;

	const body = await event.request.json().catch(() => null);
	const parsed = zUpdateNotificationSchedule.safeParse(body);
	if (!parsed.success) throw error(400, JSON.stringify(parsed.error.flatten()));

	const [updated] = await db
		.update(notificationSchedules)
		.set(parsed.data)
		.where(eq(notificationSchedules.userId, id))
		.returning();

	if (!updated) throw error(404, 'Schedule not found');
	return json(updated);
};
