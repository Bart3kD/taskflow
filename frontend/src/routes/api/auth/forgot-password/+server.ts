import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { zForgotPassword } from '$lib/types';
import { sendPasswordResetEmail } from '$lib/notifications/email';
import { APP_URL } from '$lib/env';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	const parsed = zForgotPassword.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid request');

	const { email } = parsed.data;

	const [user] = await db
		.select({ id: users.id, name: users.name, email: users.email })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	if (user) {
		const token = crypto.randomUUID();
		const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

		await db
			.update(users)
			.set({ passwordResetToken: token, passwordResetExpiresAt: expiresAt })
			.where(eq(users.id, user.id));

		await sendPasswordResetEmail(user, token, APP_URL).catch((err) => {
			console.error('Failed to send password reset email:', err);
		});
	}

	// Always return success to avoid revealing whether the email exists
	return json({ ok: true });
};
