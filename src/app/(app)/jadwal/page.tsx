import { Suspense } from "react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadSchedule, parseScheduleParams } from "@/lib/schedule";
import { mondayOf, todayStr } from "@/lib/weeks";
import { ScheduleBoard } from "./schedule-board";
import { ScheduleFilters } from "./filters";

export const metadata: Metadata = { title: "Jadwal" };

async function Schedule({ searchParams }: { searchParams: PageProps<"/jadwal">["searchParams"] }) {
  const user = await requireUser();
  const today = todayStr();
  const data = await loadSchedule(parseScheduleParams(await searchParams, today.slice(0, 7)));
  return (
    <>
      <ScheduleFilters data={data} currentMonth={today.slice(0, 7)} />
      <ScheduleBoard data={data} isAdmin={user.role === "admin"} currentWeek={mondayOf(today)} />
    </>
  );
}

export default function JadwalPage({ searchParams }: PageProps<"/jadwal">) {
  return (
    <Suspense fallback={<div className="card h-96 animate-pulse bg-slate-100" aria-label="Memuat jadwal" />}>
      <Schedule searchParams={searchParams} />
    </Suspense>
  );
}
