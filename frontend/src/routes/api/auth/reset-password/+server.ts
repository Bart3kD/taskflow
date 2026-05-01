import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { zResetPassword } from '$lib/types';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const parsed = zResetPassword.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid request');

	const { token, newPassword } = parsed.data;

	const [user] = await db
		.select({ id: users.id })
		.from(users)
		.where(
			and(
				eq(users.passwordResetToken, token),
				gt(users.passwordResetExpiresAt, new Date())
			)
		)
		.limit(1);

	if (!user) throw error(400, 'This reset link is invalid or has expired');

	const passwordHash = await bcrypt.hash(newPassword, 12);

	await db
		.update(users)
		.set({ passwordHash, passwordResetToken: null, passwordResetExpiresAt: null })
		.where(eq(users.id, user.id));

	return json({ ok: true });
};
