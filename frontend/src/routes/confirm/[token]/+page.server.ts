import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/db';
import { statusTokens, tasks } from '$lib/db/schema';
import { zConfirmStatus } from '$lib/types';
import { eq } from 'drizzle-orm';

async function resolveToken(token: string) {
	const [row] = await db
		.select()
		.from(statusTokens)
		.where(eq(statusTokens.token, token))
		.limit(1);

	if (!row) throw error(404, 'Token not found');
	if (row.usedAt) throw error(410, 'This link has already been used');
	if (row.expiresAt < new Date()) throw error(410, 'This link has expired');

	return row;
}

export const load: PageServerLoad = async ({ params, url }) => {
	const tokenRow = await resolveToken(params.token);

	const [task] = await db
		.select({ id: tasks.id, title: tasks.title })
		.from(tasks)
		.where(eq(tasks.id, tokenRow.taskId))
		.limit(1);

	if (!task) throw error(404, 'Task not found');

	const statusParam = url.searchParams.get('status');
	if (!statusParam) return { task, token: params.token, confirmed: false };

	const parsed = zConfirmStatus.safeParse({ status: statusParam });
	if (!parsed.success) throw error(400, 'Invalid status');

	const { status } = parsed.data;

	await db
		.update(tasks)
		.set({ status, updatedAt: new Date() })
		.where(eq(tasks.id, tokenRow.taskId));

	await db
		.update(statusTokens)
		.set({ usedAt: new Date() })
		.where(eq(statusTokens.token, params.token));

	return { task, token: params.token, confirmed: true };
};
