import type { Task } from '$lib/db/schema';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

function nextOccurrenceEveryNDays(createdAt: Date, n: number, now: Date): Date {
	const created = startOfDay(createdAt).getTime();
	const current = startOfDay(now).getTime();
	const elapsed = current - created;
	const periods = Math.ceil(elapsed / (n * MS_PER_DAY));
	return new Date(created + periods * n * MS_PER_DAY);
}

function nextDayOfMonth(dayOfMonth: number, hour: number, now: Date): Date {
	const candidate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth, hour, 0, 0, 0);
	if (candidate <= now) {
		candidate.setMonth(candidate.getMonth() + 1);
	}
	return candidate;
}

function nextDayOfWeek(dayOfWeek: number, hour: number, now: Date): Date {
	const candidate = new Date(now);
	candidate.setHours(hour, 0, 0, 0);
	const diff = (dayOfWeek - now.getDay() + 7) % 7;
	candidate.setDate(now.getDate() + (diff === 0 && candidate <= now ? 7 : diff));
	return candidate;
}

function nextFirstDayOfMonth(hour: number, now: Date): Date {
	const candidate = new Date(now.getFullYear(), now.getMonth(), 1, hour, 0, 0, 0);
	if (candidate <= now) {
		candidate.setMonth(candidate.getMonth() + 1);
	}
	return candidate;
}

function nextLastDayOfMonth(hour: number, now: Date): Date {
	const candidate = new Date(now.getFullYear(), now.getMonth() + 1, 0, hour, 0, 0, 0);
	if (candidate <= now) {
		candidate.setMonth(candidate.getMonth() + 2);
		candidate.setDate(0);
	}
	return candidate;
}

export function computeNextDeadline(task: Task, now: Date = new Date()): Date | null {
	if (task.deadlineType === 'once') {
		return task.deadlineDate ?? null;
	}

	const cfg = task.recurrenceConfig ?? {};
	const hour = cfg.hour ?? 9;

	switch (task.recurrenceType) {
		case 'every_n_days': {
			const n = cfg.n ?? 7;
			return nextOccurrenceEveryNDays(task.createdAt, n, now);
		}
		case 'day_of_month': {
			const day = cfg.dayOfMonth ?? 1;
			return nextDayOfMonth(day, hour, now);
		}
		case 'day_of_week': {
			const dow = cfg.dayOfWeek ?? 1;
			return nextDayOfWeek(dow, hour, now);
		}
		case 'first_day_of_month':
			return nextFirstDayOfMonth(hour, now);
		case 'last_day_of_month':
			return nextLastDayOfMonth(hour, now);
		default:
			return null;
	}
}

export function daysBetween(from: Date, to: Date): number {
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}
