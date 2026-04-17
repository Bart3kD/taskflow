import {
	pgTable,
	uuid,
	text,
	timestamp,
	pgEnum,
	json,
	integer,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'member']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'done', 'overdue', 'problem']);
export const deadlineTypeEnum = pgEnum('deadline_type', ['once', 'recurring']);
export const recurrenceTypeEnum = pgEnum('recurrence_type', [
	'every_n_days',
	'day_of_month',
	'day_of_week',
	'first_day_of_month',
	'last_day_of_month'
]);
export const channelEnum = pgEnum('channel', ['email', 'telegram', 'both']);
export const reportFrequencyEnum = pgEnum('report_frequency', ['every_n_days', 'weekly']);
export const notificationTypeEnum = pgEnum('notification_type', ['reminder', 'report']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	telegramChatId: text('telegram_chat_id'),
	role: roleEnum('role').notNull().default('member'),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const tasks = pgTable('tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	description: text('description'),
	assignedTo: uuid('assigned_to')
		.notNull()
		.references(() => users.id),
	createdBy: uuid('created_by')
		.notNull()
		.references(() => users.id),
	status: taskStatusEnum('status').notNull().default('pending'),
	deadlineType: deadlineTypeEnum('deadline_type').notNull(),
	recurrenceType: recurrenceTypeEnum('recurrence_type'),
	deadlineDate: timestamp('deadline_date'),
	recurrenceConfig: json('recurrence_config').$type<{
		n?: number;
		dayOfMonth?: number;
		dayOfWeek?: number;
		hour?: number;
	}>(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	assignedNotifiedAt: timestamp('assigned_notified_at')
});

export const statusTokens = pgTable('status_tokens', {
	id: uuid('id').primaryKey().defaultRandom(),
	taskId: uuid('task_id')
		.notNull()
		.references(() => tasks.id),
	token: uuid('token').notNull().unique().defaultRandom(),
	expiresAt: timestamp('expires_at').notNull(),
	usedAt: timestamp('used_at')
});

export const notificationSchedules = pgTable(
	'notification_schedules',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),
		reportFrequency: reportFrequencyEnum('report_frequency').notNull().default('every_n_days'),
		reportDayOfWeek: integer('report_day_of_week'),
		reportTime: text('report_time').notNull().default('09:00'),
		reportChannel: channelEnum('report_channel').notNull().default('email'),
		reminderChannel: channelEnum('reminder_channel').notNull().default('email'),
		reminderDaysBefore: json('reminder_days_before')
			.$type<number[]>()
			.notNull()
			.default([2, 1, 0]),
		reportEveryNDays: integer('report_every_n_days').notNull().default(7)
	},
	(t) => [uniqueIndex('notification_schedules_user_id_idx').on(t.userId)]
);

export const notificationLogs = pgTable('notification_logs', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id),
	taskId: uuid('task_id').references(() => tasks.id),
	type: notificationTypeEnum('type').notNull(),
	channel: channelEnum('channel').notNull(),
	sentAt: timestamp('sent_at').notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type StatusToken = typeof statusTokens.$inferSelect;
export type NewStatusToken = typeof statusTokens.$inferInsert;
export type NotificationSchedule = typeof notificationSchedules.$inferSelect;
export type NotificationLog = typeof notificationLogs.$inferSelect;
export type NewNotificationLog = typeof notificationLogs.$inferInsert;
