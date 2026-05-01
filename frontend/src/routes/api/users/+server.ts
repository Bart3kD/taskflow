import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { randomBytes } from 'crypto';
import { db } from '$lib/db';
import { users, notificationSchedules } from '$lib/db/schema';
import { requireAdmin } from '$lib/auth/jwt';
import { zCreateUser } from '$lib/types';
import { sendWelcomeEmail } from '$lib/notifications/email';
import { APP_URL } from '$env/static/private';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

function generateTempPassword(): string {
	return randomBytes(9).toString('base64url');
}

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

	const { name, email, role, telegramChatId } = parsed.data;

	const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
	if (existing.length > 0) throw error(409, 'A member with this email already exists');

	const tempPassword = generateTempPassword();
	const passwordHash = await bcrypt.hash(tempPassword, 12);

	const [user] = await db
		.insert(users)
		.values({ name, email, passwordHash, role, telegramChatId, onboardingCompleted: false })
		.returning({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		});

	await db.insert(notificationSchedules).values({ userId: user.id });

	let emailSent = false;
	try {
		await sendWelcomeEmail({ email, name }, tempPassword, APP_URL);
		emailSent = true;
	} catch (err) {
		console.error('Failed to send welcome email:', err);
	}

	return json({ ...user, tempPassword, emailSent }, { status: 201 });
};
