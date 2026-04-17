import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { requireAuth } from '$lib/auth/jwt';
import { zChangePassword } from '$lib/types';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	const { id } = event.params;

	if (auth.role !== 'admin' && auth.userId !== id) throw error(403, 'Forbidden');

	const body = await event.request.json().catch(() => null);
	const parsed = zChangePassword.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid request');

	const { currentPassword, newPassword } = parsed.data;

	const [user] = await db
		.select({ id: users.id, passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.id, id))
		.limit(1);

	if (!user) throw error(404, 'User not found');

	if (auth.role !== 'admin') {
		if (!currentPassword) throw error(400, 'Current password is required');
		const valid = await bcrypt.compare(currentPassword, user.passwordHash);
		if (!valid) throw error(400, 'Current password is incorrect');
	}

	const newHash = await bcrypt.hash(newPassword, 12);
	await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, id));

	return json({ ok: true });
};
