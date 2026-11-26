import "server-only";
import { and, asc, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { activities, officers, taskOfficers, tasks, teams, type TaskStatus } from "@/db/schema";
import { STATUS_KEYS } from "./labels";
import {
  addMonths,
  isValidMonth,
  MAX_MONTHS,
  monthDiff,
  monthRange,
  type DateStr,
  type MonthKey,
  type MonthWeeks,
} from "./weeks";

export type ScheduleParams = {
  from: MonthKey;
  to: MonthKey;
  team: number | null;
  officer: number | null;
  status: TaskStatus | null;
  q: string;
};

export type TaskView = {
  id: number;
  activityId: number;
  weekStart: DateStr;
  title: string;
  notes: string | null;
  status: TaskStatus;
  replacementType: "jadwal_ulang" | "ganti_kegiatan" | null;
  replacementWeek: DateStr | null;
  replacementActivity: string | null;
  replacementNote: string | null;
  rescheduledFromId: number | null;
  /** Minggu task asal (bila task ini hasil jadwal ulang). */
  fromWeek: DateStr | null;
  /** Minggu task pengganti yang masih ada (bila task ini dijadwal ulang). */
  childWeek: DateStr | null;
  officerIds: number[];
};

export type ActivityRow = { id: number; name: string; description: string | null };
export type TeamRow = { id: number; name: string; activities: ActivityRow[] };
export type OfficerOption = { id: number; name: string; position: string | null; teamId: number | null };

export type ScheduleData = {
  params: ScheduleParams;
  months: MonthWeeks[];
  teams: TeamRow[];
  tasks: TaskView[];
  officers: OfficerOption[];
  allTeams: { id: number; name: string }[];
  filtered: boolean;
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const posInt = (v: string) => (/^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null);

export function parseScheduleParams(sp: SP, currentMonth: MonthKey): ScheduleParams {
  let from = one(sp.from);
  let to = one(sp.to);
  if (!isValidMonth(from)) from = currentMonth;
  if (!isValidMonth(to)) to = addMonths(from, 2);
  if (monthDiff(from, to) < 0) to = from;
  if (monthDiff(from, to) >= MAX_MONTHS) to = addMonths(from, MAX_MONTHS - 1);
  const status = one(sp.status);
  return {
    from,
    to,
    team: posInt(one(sp.team)),
    officer: posInt(one(sp.officer)),
    status: (STATUS_KEYS as string[]).includes(status) ? (status as TaskStatus) : null,
    q: one(sp.q).trim().slice(0, 100),
  };
}

export function paramsToQuery(p: ScheduleParams): string {
  const q = new URLSearchParams({ from: p.from, to: p.to });
  if (p.team) q.set("team", String(p.team));
  if (p.officer) q.set("officer", String(p.officer));
  if (p.status) q.set("status", p.status);
  if (p.q) q.set("q", p.q);
  return q.toString();
}

export async function loadSchedule(params: ScheduleParams): Promise<ScheduleData> {
  const months = monthRange(params.from, params.to);
  const firstWeek = months[0].weeks[0].start;
  const lastMonth = months[months.length - 1];
  const lastWeek = lastMonth.weeks[lastMonth.weeks.length - 1].start;

  const [teamRows, activityRows, officerRows] = await Promise.all([
    db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(asc(teams.sortOrder), asc(teams.name)),
    db
      .select({ id: activities.id, teamId: activities.teamId, name: activities.name, description: activities.description })
      .from(activities)
      .orderBy(asc(activities.sortOrder), asc(activities.name)),
    db
      .select({ id: officers.id, name: officers.name, position: officers.position, teamId: officers.teamId })
      .from(officers)
      .orderBy(asc(officers.name)),
  ]);

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(gte(tasks.weekStart, firstWeek), lte(tasks.weekStart, lastWeek)))
    .orderBy(asc(tasks.id));

  const ids = taskRows.map((t) => t.id);
  const fromIds = [...new Set(taskRows.map((t) => t.rescheduledFromId).filter((x): x is number => x !== null))];
  const [assignRows, childRows, parentRows] = await Promise.all([
    ids.length
      ? db.select().from(taskOfficers).where(inArray(taskOfficers.taskId, ids))
      : Promise.resolve([]),
    ids.length
      ? db
          .select({ from: tasks.rescheduledFromId, weekStart: tasks.weekStart })
          .from(tasks)
          .where(inArray(tasks.rescheduledFromId, ids))
      : Promise.resolve([]),
    fromIds.length
      ? db.select({ id: tasks.id, weekStart: tasks.weekStart }).from(tasks).where(inArray(tasks.id, fromIds))
      : Promise.resolve([]),
  ]);

  const officersByTask = new Map<number, number[]>();
  for (const a of assignRows) {
    const list = officersByTask.get(a.taskId) ?? [];
    list.push(a.officerId);
    officersByTask.set(a.taskId, list);
  }
  const childWeek = new Map(childRows.map((c) => [c.from!, c.weekStart]));
  const parentWeek = new Map(parentRows.map((p) => [p.id, p.weekStart]));

  let taskViews: TaskView[] = taskRows.map((t) => ({
    id: t.id,
    activityId: t.activityId,
    weekStart: t.weekStart,
    title: t.title,
    notes: t.notes,
    status: t.status,
    replacementType: t.replacementType,
    replacementWeek: t.replacementWeek,
    replacementActivity: t.replacementActivity,
    replacementNote: t.replacementNote,
    rescheduledFromId: t.rescheduledFromId,
    fromWeek: t.rescheduledFromId ? (parentWeek.get(t.rescheduledFromId) ?? null) : null,
    childWeek: childWeek.get(t.id) ?? null,
    officerIds: officersByTask.get(t.id) ?? [],
  }));

  // ---- Filter ----
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));
  let visibleActivities = activityRows.filter((a) => !params.team || a.teamId === params.team);
  const filtered = Boolean(params.officer || params.status || params.q);

  if (filtered) {
    const q = params.q.toLowerCase();
    const actMatch = new Set(
      q
        ? visibleActivities
            .filter((a) => a.name.toLowerCase().includes(q) || teamName.get(a.teamId)!.toLowerCase().includes(q))
            .map((a) => a.id)
        : [],
    );
    taskViews = taskViews.filter(
      (t) =>
        (!params.officer || t.officerIds.includes(params.officer)) &&
        (!params.status || t.status === params.status) &&
        (!q ||
          actMatch.has(t.activityId) ||
          [t.title, t.notes, t.replacementActivity].some((s) => s?.toLowerCase().includes(q))),
    );
    const withTasks = new Set(taskViews.map((t) => t.activityId));
    visibleActivities = visibleActivities.filter((a) => withTasks.has(a.id));
  }

  const visibleIds = new Set(visibleActivities.map((a) => a.id));
  taskViews = taskViews.filter((t) => visibleIds.has(t.activityId));

  const teamsOut: TeamRow[] = teamRows
    .filter((t) => !params.team || t.id === params.team)
    .map((t) => ({
      id: t.id,
      name: t.name,
      activities: visibleActivities
        .filter((a) => a.teamId === t.id)
        .map(({ id, name, description }) => ({ id, name, description })),
    }))
    .filter((t) => !filtered || t.activities.length > 0);

  return { params, months, teams: teamsOut, tasks: taskViews, officers: officerRows, allTeams: teamRows, filtered };
}
