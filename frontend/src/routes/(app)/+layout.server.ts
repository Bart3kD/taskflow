import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { verifyToken } from '$lib/auth/jwt';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const token = cookies.get('session');
	if (!token) throw redirect(302, '/login');

	const payload = await verifyToken(token);
	if (!payload) {
		cookies.delete('session', { path: '/' });
		throw redirect(302, '/login');
	}

	const [user] = await db
		.select({ id: users.id, name: users.name, role: users.role, onboardingCompleted: users.onboardingCompleted, avatarUrl: users.avatarUrl })
		.from(users)
		.where(eq(users.id, payload.userId))
		.limit(1);

	if (!user) {
		cookies.delete('session', { path: '/' });
		throw redirect(302, '/login');
	}
	if (user.role === 'member' && !user.onboardingCompleted) throw redirect(302, '/onboarding');

	return { user: { id: user.id, name: user.name, role: user.role, avatarUrl: user.avatarUrl } };
};
