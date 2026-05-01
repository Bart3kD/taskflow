import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { requireAuth } from '$lib/auth/jwt';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const auth = await requireAuth(event);

	const [user] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			telegramChatId: users.telegramChatId,
			avatarUrl: users.avatarUrl
		})
		.from(users)
		.where(eq(users.id, auth.userId))
		.limit(1);

	if (!user) throw error(404, 'User not found');

	return { user };
};
