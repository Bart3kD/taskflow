import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { verifyToken } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get('session');
	if (!token) throw redirect(302, '/login');

	const payload = await verifyToken(token);
	if (!payload) {
		cookies.delete('session', { path: '/' });
		throw redirect(302, '/login');
	}

	const [user] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			telegramChatId: users.telegramChatId,
			onboardingCompleted: users.onboardingCompleted
		})
		.from(users)
		.where(eq(users.id, payload.userId))
		.limit(1);

	if (!user) {
		cookies.delete('session', { path: '/' });
		throw redirect(302, '/login');
	}
	if (user.role === 'admin' || user.onboardingCompleted) throw redirect(302, '/dashboard');

	return { user };
};
