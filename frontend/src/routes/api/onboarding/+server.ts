import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { zCompleteOnboarding } from '$lib/types';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);

	const body = await event.request.json().catch(() => null);
	const parsed = zCompleteOnboarding.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid request body');

	const { newPassword, avatarUrl } = parsed.data;
	const passwordHash = await bcrypt.hash(newPassword, 12);

	const [user] = await db
		.update(users)
		.set({ passwordHash, avatarUrl: avatarUrl ?? null, onboardingCompleted: true })
		.where(eq(users.id, auth.userId))
		.returning({ id: users.id, name: users.name, email: users.email, role: users.role });

	if (!user) throw error(404, 'User not found');

	return json(user);
};
