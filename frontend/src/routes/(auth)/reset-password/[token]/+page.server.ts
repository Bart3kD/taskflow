import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const [user] = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(
			and(
				eq(users.passwordResetToken, params.token),
				gt(users.passwordResetExpiresAt, new Date())
			)
		)
		.limit(1);

	if (!user) throw redirect(302, '/forgot-password?expired=1');

	return { token: params.token, name: user.name };
};
