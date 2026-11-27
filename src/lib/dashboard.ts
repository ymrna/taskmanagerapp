import "server-only";
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import { activities, officers, taskOfficers, tasks, teams, type TaskStatus } from "@/db/schema";
import { mondayOf, monthLabel, monthOfWeek, todayStr, weeksOfMonth, type DateStr } from "./weeks";

export type StatusCounts = Record<TaskStatus, number> & { total: number };
const empty = (): StatusCounts => ({ belum: 0, selesai: 0, diganti: 0, tidak_dikerjakan: 0, total: 0 });

export type DashboardData = {
  year: number;
  team: number | null;
  teams: { id: number; name: string }[];
  currentWeek: DateStr;
  currentMonth: string;
  totals: StatusCounts;
  overdue: number;
  thisWeek: number;
  months: { month: string; label: string; counts: StatusCounts }[];
  perActivity: { id: number; name: string; teamId: number; teamName: string; counts: StatusCounts }[];
  upcoming: {
    id: number;
    title: string;
    weekStart: DateStr;
    teamName: string;
    activityName: string;
    officers: string[];
  }[];
};

export async function loadDashboard(sp: Record<string, string | string[] | undefined>): Promise<DashboardData> {
  const today = todayStr();
  const currentWeek = mondayOf(today);
  const currentYear = Number(today.slice(0, 4));
  const rawYear = Number(Array.isArray(sp.year) ? sp.year[0] : sp.year);
  const year = Number.isInteger(rawYear) && rawYear >= 2000 && rawYear <= 2100 ? rawYear : currentYear;
  const rawTeam = Number(Array.isArray(sp.team) ? sp.team[0] : sp.team);
  const teamParam = Number.isInteger(rawTeam) && rawTeam > 0 ? rawTeam : null;

  const first = weeksOfMonth(`${year}-01`)[0].start;
  const decWeeks = weeksOfMonth(`${year}-12`);
  const last = decWeeks[decWeeks.length - 1].start;

  const teamRows = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .orderBy(asc(teams.sortOrder), asc(teams.name));
  const team = teamParam && teamRows.some((t) => t.id === teamParam) ? teamParam : null;
  const teamFilter = team ? eq(activities.teamId, team) : undefined;

  const [actRows, yearTasks, upcomingRows] = await Promise.all([
    db
      .select({ id: activities.id, name: activities.name, teamId: activities.teamId })
      .from(activities)
      .innerJoin(teams, eq(teams.id, activities.teamId))
      .where(teamFilter)
      .orderBy(asc(teams.sortOrder), asc(teams.name), asc(activities.sortOrder), asc(activities.name)),
    db
      .select({ activityId: tasks.activityId, weekStart: tasks.weekStart, status: tasks.status })
      .from(tasks)
      .innerJoin(activities, eq(activities.id, tasks.activityId))
      .where(and(gte(tasks.weekStart, first), lte(tasks.weekStart, last), teamFilter)),
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        weekStart: tasks.weekStart,
        activityName: activities.name,
        teamName: teams.name,
      })
      .from(tasks)
      .innerJoin(activities, eq(activities.id, tasks.activityId))
      .innerJoin(teams, eq(teams.id, activities.teamId))
      .where(and(eq(tasks.status, "belum"), gte(tasks.weekStart, currentWeek), teamFilter))
      .orderBy(asc(tasks.weekStart), asc(teams.sortOrder), asc(tasks.id))
      .limit(8),
  ]);

  // Hitung per bulan & per kegiatan
  const totals = empty();
  const byMonth = new Map<string, StatusCounts>();
  const byActivity = new Map<number, StatusCounts>();
  let overdue = 0;
  let thisWeek = 0;
  for (const t of yearTasks) {
    const month = monthOfWeek(t.weekStart);
    for (const c of [
      totals,
      byMonth.get(month) ?? byMonth.set(month, empty()).get(month)!,
      byActivity.get(t.activityId) ?? byActivity.set(t.activityId, empty()).get(t.activityId)!,
    ]) {
      c[t.status]++;
      c.total++;
    }
    if (t.status === "belum" && t.weekStart < currentWeek) overdue++;
    if (t.weekStart === currentWeek) thisWeek++;
  }

  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));
  const officerRows = upcomingRows.length
    ? await db
        .select({ taskId: taskOfficers.taskId, name: officers.name })
        .from(taskOfficers)
        .innerJoin(officers, eq(officers.id, taskOfficers.officerId))
        .where(inArray(taskOfficers.taskId, upcomingRows.map((u) => u.id)))
    : [];

  return {
    year,
    team,
    teams: teamRows,
    currentWeek,
    currentMonth: today.slice(0, 7),
    totals,
    overdue,
    thisWeek,
    months: Array.from({ length: 12 }, (_, i) => {
      const month = `${year}-${String(i + 1).padStart(2, "0")}`;
      return { month, label: monthLabel(month, true).split(" ")[0], counts: byMonth.get(month) ?? empty() };
    }),
    perActivity: actRows.map((a) => ({
      ...a,
      teamName: teamName.get(a.teamId) ?? "",
      counts: byActivity.get(a.id) ?? empty(),
    })),
    upcoming: upcomingRows.map((u) => ({
      ...u,
      officers: officerRows.filter((o) => o.taskId === u.id).map((o) => o.name),
    })),
  };
}
