import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { signToken } from '$lib/auth/jwt';
import { zLoginRequest } from '$lib/types';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => null);
	const parsed = zLoginRequest.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid request body');

	const { email, password } = parsed.data;

	const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (!user) throw error(401, 'Invalid credentials');

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) throw error(401, 'Invalid credentials');

	const token = await signToken({ userId: user.id, role: user.role });

	cookies.set('session', token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		path: '/',
		maxAge: 60 * 60 * 24 * 7
	});

	return json({ id: user.id, name: user.name, email: user.email, role: user.role });
};
