import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { TELEGRAM_BOT_USERNAME } from '$lib/env';

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);

	let targetUserId: string;
	if (auth.role === 'admin') {
		const body = await event.request.json().catch(() => ({}));
		targetUserId = body.userId ?? auth.userId;
	} else {
		targetUserId = auth.userId;
	}

	const token = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	await db
		.update(users)
		.set({ telegramLinkToken: token, telegramLinkExpiresAt: expiresAt })
		.where(eq(users.id, targetUserId));

	return json({ url: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}` });
};
