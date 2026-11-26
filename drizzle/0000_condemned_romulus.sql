CREATE TYPE "public"."replacement_type" AS ENUM('jadwal_ulang', 'ganti_kegiatan');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'anggota');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('belum', 'selesai', 'diganti', 'tidak_dikerjakan');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "officers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"nip" text,
	"position" text,
	"phone" text,
	"email" text,
	"team_id" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_officers" (
	"task_id" integer NOT NULL,
	"officer_id" integer NOT NULL,
	CONSTRAINT "task_officers_task_id_officer_id_pk" PRIMARY KEY("task_id","officer_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"activity_id" integer NOT NULL,
	"week_start" date NOT NULL,
	"title" text NOT NULL,
	"notes" text,
	"status" "task_status" DEFAULT 'belum' NOT NULL,
	"replacement_type" "replacement_type",
	"replacement_week" date,
	"replacement_activity" text,
	"replacement_note" text,
	"rescheduled_from_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'anggota' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "officers" ADD CONSTRAINT "officers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_officers" ADD CONSTRAINT "task_officers_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_officers" ADD CONSTRAINT "task_officers_officer_id_officers_id_fk" FOREIGN KEY ("officer_id") REFERENCES "public"."officers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_rescheduled_from_id_tasks_id_fk" FOREIGN KEY ("rescheduled_from_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_team_idx" ON "activities" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "task_officers_officer_idx" ON "task_officers" USING btree ("officer_id");--> statement-breakpoint
CREATE INDEX "tasks_week_idx" ON "tasks" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "tasks_activity_idx" ON "tasks" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "tasks_from_idx" ON "tasks" USING btree ("rescheduled_from_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");