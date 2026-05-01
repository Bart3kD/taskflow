CREATE TYPE "public"."channel" AS ENUM('email', 'telegram', 'both');--> statement-breakpoint
CREATE TYPE "public"."deadline_type" AS ENUM('once', 'recurring');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('reminder', 'report');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('every_n_days', 'day_of_month', 'day_of_week', 'first_day_of_month', 'last_day_of_month');--> statement-breakpoint
CREATE TYPE "public"."report_frequency" AS ENUM('every_n_days', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'done', 'overdue', 'problem');--> statement-breakpoint
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid,
	"type" "notification_type" NOT NULL,
	"channel" "channel" NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"report_frequency" "report_frequency" DEFAULT 'every_n_days' NOT NULL,
	"report_day_of_week" integer,
	"report_time" text DEFAULT '09:00' NOT NULL,
	"report_channel" "channel" DEFAULT 'email' NOT NULL,
	"reminder_channel" "channel" DEFAULT 'email' NOT NULL,
	"reminder_days_before" json DEFAULT '[2,1,0]'::json NOT NULL,
	"report_every_n_days" integer DEFAULT 7 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "status_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"assigned_to" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"deadline_type" "deadline_type" NOT NULL,
	"recurrence_type" "recurrence_type",
	"deadline_date" timestamp,
	"recurrence_config" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"assigned_notified_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"telegram_chat_id" text,
	"telegram_link_token" text,
	"telegram_link_expires_at" timestamp,
	"role" "role" DEFAULT 'member' NOT NULL,
	"avatar_url" text,
	"onboarding_completed" boolean DEFAULT true NOT NULL,
	"password_reset_token" text,
	"password_reset_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_telegram_link_token_unique" UNIQUE("telegram_link_token"),
	CONSTRAINT "users_password_reset_token_unique" UNIQUE("password_reset_token")
);
--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_schedules" ADD CONSTRAINT "notification_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_tokens" ADD CONSTRAINT "status_tokens_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_schedules_user_id_idx" ON "notification_schedules" USING btree ("user_id");