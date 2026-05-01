import { z } from 'zod';

// ####################
// Branded types
// ####################

export type UserId = string & { readonly __brand: 'UserId' };
export type TaskId = string & { readonly __brand: 'TaskId' };
export type TokenId = string & { readonly __brand: 'TokenId' };

export function asUserId(id: string): UserId {
	return id as UserId;
}
export function asTaskId(id: string): TaskId {
	return id as TaskId;
}

// ####################
// Zod schemas
// ####################

export const zLoginRequest = z.object({
	email: z.email(),
	password: z.string().min(1)
});

export const zCreateUser = z.object({
	name: z.string().min(1),
	email: z.email(),
	role: z.enum(['admin', 'member']).default('member'),
	telegramChatId: z.string().optional()
});

export const zChangePassword = z.object({
	currentPassword: z.string().min(1).optional(),
	newPassword: z.string().min(8)
});

export const zUpdateUser = z.object({
	name: z.string().min(1).optional(),
	email: z.email().optional(),
	telegramChatId: z.string().nullable().optional(),
	avatarUrl: z.string().nullable().optional(),
	role: z.enum(['admin', 'member']).optional()
});

export const zCompleteOnboarding = z.object({
	newPassword: z.string().min(8),
	avatarUrl: z.string().nullable().optional()
});

export const zRecurrenceConfig = z.object({
	n: z.number().int().positive().optional(),
	dayOfMonth: z.number().int().min(1).max(31).optional(),
	dayOfWeek: z.number().int().min(0).max(6).optional(),
	hour: z.number().int().min(0).max(23).optional()
});

export const zCreateTask = z.object({
	title: z.string().min(1),
	description: z.string().optional(),
	assignedTo: z.uuid(),
	deadlineType: z.enum(['once', 'recurring']),
	recurrenceType: z
		.enum(['every_n_days', 'day_of_month', 'day_of_week', 'first_day_of_month', 'last_day_of_month'])
		.optional(),
	deadlineDate: z.iso.datetime().optional(),
	recurrenceConfig: zRecurrenceConfig.optional()
});

export const zUpdateTask = z.object({
	title: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	assignedTo: z.uuid().optional(),
	status: z.enum(['pending', 'in_progress', 'done', 'overdue', 'problem']).optional(),
	deadlineType: z.enum(['once', 'recurring']).optional(),
	recurrenceType: z
		.enum(['every_n_days', 'day_of_month', 'day_of_week', 'first_day_of_month', 'last_day_of_month'])
		.nullable()
		.optional(),
	deadlineDate: z.iso.datetime().nullable().optional(),
	recurrenceConfig: zRecurrenceConfig.nullable().optional()
});

export const zConfirmStatus = z.object({
	status: z.enum(['done', 'in_progress', 'problem'])
});

export const zUpdateNotificationSchedule = z.object({
	reportFrequency: z.enum(['every_n_days', 'weekly']).optional(),
	reportDayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
	reportTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
	reportChannel: z.enum(['email', 'telegram', 'both']).optional(),
	reminderChannel: z.enum(['email', 'telegram', 'both']).optional(),
	reminderDaysBefore: z.array(z.number().int().min(0)).optional(),
	reportEveryNDays: z.number().int().positive().optional()
});

export type LoginRequest = z.infer<typeof zLoginRequest>;
export type CreateUser = z.infer<typeof zCreateUser>;
export type CreateTask = z.infer<typeof zCreateTask>;
export type UpdateTask = z.infer<typeof zUpdateTask>;
export type ConfirmStatus = z.infer<typeof zConfirmStatus>;
