import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { statusTokens, tasks } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const [token] = await db
		.select()
		.from(statusTokens)
		.where(eq(statusTokens.token, params.token))
		.limit(1);

	if (!token) throw error(404, 'Token not found');
	if (token.usedAt) throw error(410, 'This link has already been used');
	if (token.expiresAt < new Date()) throw error(410, 'This link has expired');

	const [task] = await db.select({ id: tasks.id, title: tasks.title }).from(tasks).where(eq(tasks.id, token.taskId)).limit(1);
	if (!task) throw error(404, 'Task not found');

	return { task };
};
