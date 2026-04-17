import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { TELEGRAM_BOT_USERNAME } from '$env/static/private';

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	if (auth.role !== 'admin') throw error(403, 'Forbidden');

	const { userId } = await event.request.json();
	if (!userId) throw error(400, 'userId required');

	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	await db
		.update(users)
		.set({ telegramLinkToken: token, telegramLinkExpiresAt: expiresAt })
		.where(eq(users.id, userId));

	return json({ url: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}` });
};
