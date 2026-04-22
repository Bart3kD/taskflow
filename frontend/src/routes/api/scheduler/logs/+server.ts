import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { notificationLogs } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	if (auth.role !== 'admin') throw error(403, 'Forbidden');

	await db.delete(notificationLogs).where(eq(notificationLogs.type, 'reminder'));

	return json({ ok: true });
};
