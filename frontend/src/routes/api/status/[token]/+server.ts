import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
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
	if (row.usedAt) throw error(410, 'Token already used');
	if (row.expiresAt < new Date()) throw error(410, 'Token expired');

	return row;
}

export const GET: RequestHandler = async ({ params }) => {
	const row = await resolveToken(params.token);
	const [task] = await db.select().from(tasks).where(eq(tasks.id, row.taskId)).limit(1);
	if (!task) throw error(404, 'Task not found');

	return json({ task: { id: task.id, title: task.title, status: task.status } });
};

export const POST: RequestHandler = async ({ params, request }) => {
	const row = await resolveToken(params.token);

	const body = await request.json().catch(() => null);
	const parsed = zConfirmStatus.safeParse(body);
	if (!parsed.success) throw error(400, 'Invalid status');

	const { status } = parsed.data;
	const taskStatus = status === 'problem' ? 'in_progress' : status;

	await db
		.update(tasks)
		.set({ status: taskStatus, updatedAt: new Date() })
		.where(eq(tasks.id, row.taskId));

	await db
		.update(statusTokens)
		.set({ usedAt: new Date() })
		.where(eq(statusTokens.token, params.token));

	return json({ ok: true, status: taskStatus });
};
