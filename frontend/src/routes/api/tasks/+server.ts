import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { tasks } from '$lib/db/schema';
import { requireAuth } from '$lib/auth/jwt';
import { zCreateTask } from '$lib/types';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async (event) => {
	const auth = await requireAuth(event);

	const rows =
		auth.role === 'admin'
			? await db.select().from(tasks)
			: await db.select().from(tasks).where(eq(tasks.assignedTo, auth.userId));

	return json(rows);
};

export const POST: RequestHandler = async (event) => {
	const auth = await requireAuth(event);
	if (auth.role !== 'admin') throw error(403, 'Only managers can create tasks');

	const body = await event.request.json().catch(() => null);
	const parsed = zCreateTask.safeParse(body);
	if (!parsed.success) throw error(400, JSON.stringify(parsed.error.flatten()));

	const { deadlineDate, ...rest } = parsed.data;

	const [task] = await db
		.insert(tasks)
		.values({
			...rest,
			createdBy: auth.userId,
			deadlineDate: deadlineDate ? new Date(deadlineDate) : undefined
		})
		.returning();

	return json(task, { status: 201 });
};
