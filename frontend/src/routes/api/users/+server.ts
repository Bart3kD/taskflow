import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users, notificationSchedules } from '$lib/db/schema';
import { requireAdmin } from '$lib/auth/jwt';
import { zCreateUser } from '$lib/types';
import bcrypt from 'bcryptjs';

export const GET: RequestHandler = async (event) => {
	await requireAdmin(event);

	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			telegramChatId: users.telegramChatId,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users);

	return json(rows);
};

export const POST: RequestHandler = async (event) => {
	await requireAdmin(event);

	const body = await event.request.json().catch(() => null);
	const parsed = zCreateUser.safeParse(body);
	if (!parsed.success) throw error(400, JSON.stringify(parsed.error.flatten()));

	const { name, email, password, role, telegramChatId } = parsed.data;

	const passwordHash = await bcrypt.hash(password, 12);

	const [user] = await db
		.insert(users)
		.values({ name, email, passwordHash, role, telegramChatId })
		.returning({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		});

	await db.insert(notificationSchedules).values({ userId: user.id });

	return json(user, { status: 201 });
};
