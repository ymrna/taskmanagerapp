import { relations } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "anggota"]);
export const taskStatusEnum = pgEnum("task_status", [
  "belum",
  "selesai",
  "diganti",
  "tidak_dikerjakan",
]);
export const replacementTypeEnum = pgEnum("replacement_type", [
  "jadwal_ulang",
  "ganti_kegiatan",
]);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("anggota"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username)],
);

export const sessions = pgTable("sessions", {
  // SHA-256 dari token di cookie; token mentah tidak pernah disimpan.
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const activities = pgTable(
  "activities",
  {
    id: serial("id").primaryKey(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("activities_team_idx").on(t.teamId)],
);

export const officers = pgTable("officers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nip: text("nip"),
  position: text("position"),
  phone: text("phone"),
  email: text("email"),
  teamId: integer("team_id").references(() => teams.id, { onDelete: "set null" }),
});

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    // Senin dari minggu tersebut (YYYY-MM-DD). Bulan & nomor minggu diturunkan dari sini.
    weekStart: date("week_start", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    notes: text("notes"),
    status: taskStatusEnum("status").notNull().default("belum"),
    replacementType: replacementTypeEnum("replacement_type"),
    replacementWeek: date("replacement_week", { mode: "string" }),
    replacementActivity: text("replacement_activity"),
    replacementNote: text("replacement_note"),
    rescheduledFromId: integer("rescheduled_from_id").references(
      (): AnyPgColumn => tasks.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("tasks_week_idx").on(t.weekStart),
    index("tasks_activity_idx").on(t.activityId),
    index("tasks_from_idx").on(t.rescheduledFromId),
  ],
);

export const taskOfficers = pgTable(
  "task_officers",
  {
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    officerId: integer("officer_id")
      .notNull()
      .references(() => officers.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.taskId, t.officerId] }), index("task_officers_officer_idx").on(t.officerId)],
);

export const teamsRelations = relations(teams, ({ many }) => ({
  activities: many(activities),
}));
export const activitiesRelations = relations(activities, ({ one, many }) => ({
  team: one(teams, { fields: [activities.teamId], references: [teams.id] }),
  tasks: many(tasks),
}));

export type Role = (typeof roleEnum.enumValues)[number];
export type TaskStatus = (typeof taskStatusEnum.enumValues)[number];
export type ReplacementType = (typeof replacementTypeEnum.enumValues)[number];
