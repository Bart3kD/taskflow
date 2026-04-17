import { db } from '$lib/db';
import { tasks, users, notificationSchedules, notificationLogs, statusTokens } from '$lib/db/schema';
import { eq, ne, and, gte, desc } from 'drizzle-orm';
import { sendReportEmail } from '$lib/notifications/email';
import { sendReportTelegram } from '$lib/notifications/telegram';
import { APP_URL } from '$env/static/private';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfToday(): Date {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function parseHour(reportTime: string): number {
	return parseInt(reportTime.split(':')[0], 10);
}

function shouldSendReport(
	schedule: { reportFrequency: string; reportDayOfWeek: number | null; reportTime: string; reportEveryNDays: number },
	lastReportAt: Date | null,
	now: Date
): boolean {
	const currentHour = now.getHours();
	const reportHour = parseHour(schedule.reportTime);

	if (currentHour < reportHour) return false;

	if (schedule.reportFrequency === 'weekly') {
		return now.getDay() === (schedule.reportDayOfWeek ?? 1);
	}

	if (schedule.reportFrequency === 'every_n_days') {
		if (!lastReportAt) return true;
		const daysSinceLast = Math.floor((now.getTime() - lastReportAt.getTime()) / MS_PER_DAY);
		return daysSinceLast >= schedule.reportEveryNDays;
	}

	return false;
}

export async function processReports(): Promise<void> {
	const today = startOfToday();
	const now = new Date();

	const usersWithSchedules = await db
		.select({
			user: { id: users.id, email: users.email, name: users.name, telegramChatId: users.telegramChatId },
			schedule: notificationSchedules
		})
		.from(users)
		.innerJoin(notificationSchedules, eq(notificationSchedules.userId, users.id));

	for (const { user, schedule } of usersWithSchedules) {
		const alreadySentToday = await db
			.select({ id: notificationLogs.id })
			.from(notificationLogs)
			.where(
				and(
					eq(notificationLogs.userId, user.id),
					eq(notificationLogs.type, 'report'),
					gte(notificationLogs.sentAt, today)
				)
			)
			.limit(1);

		if (alreadySentToday.length > 0) continue;

		const [lastReportLog] = await db
			.select({ sentAt: notificationLogs.sentAt })
			.from(notificationLogs)
			.where(and(eq(notificationLogs.userId, user.id), eq(notificationLogs.type, 'report')))
			.orderBy(desc(notificationLogs.sentAt))
			.limit(1);

		const lastReportAt = lastReportLog?.sentAt ?? null;

		if (!shouldSendReport(schedule, lastReportAt, now)) continue;

		const pendingTasks = await db
			.select()
			.from(tasks)
			.where(and(eq(tasks.assignedTo, user.id), ne(tasks.status, 'done')));

		if (pendingTasks.length === 0) continue;

		const channel = schedule.reportChannel;

		const taskTokens: { task: (typeof pendingTasks)[0]; token: string }[] = [];
		for (const task of pendingTasks) {
			const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
			const [tokenRow] = await db
				.insert(statusTokens)
				.values({ taskId: task.id, expiresAt })
				.returning();
			taskTokens.push({ task, token: tokenRow.token });
		}

		if (channel === 'email' || channel === 'both') {
			for (const { task, token } of taskTokens) {
				await sendReportEmail(user, task, token, APP_URL);
			}
		}

		if (channel === 'telegram' || channel === 'both') {
			await sendReportTelegram(user, taskTokens, APP_URL);
		}

		await db.insert(notificationLogs).values({
			userId: user.id,
			type: 'report',
			channel: channel === 'both' ? 'email' : channel
		});
	}
}
