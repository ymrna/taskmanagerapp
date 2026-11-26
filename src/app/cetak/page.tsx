import { Suspense } from "react";
import type { Metadata } from "next";
import { ScheduleBoard } from "@/app/(app)/jadwal/schedule-board";
import { requireUser } from "@/lib/auth";
import { STATUS } from "@/lib/labels";
import { loadSchedule, parseScheduleParams } from "@/lib/schedule";
import { monthLabel, mondayOf, todayStr } from "@/lib/weeks";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Cetak Jadwal" };

async function PrintView({ searchParams }: { searchParams: PageProps<"/cetak">["searchParams"] }) {
  await requireUser();
  const today = todayStr();
  const data = await loadSchedule(parseScheduleParams(await searchParams, today.slice(0, 7)));
  const p = data.params;
  const filters = [
    p.team && `Tim: ${data.allTeams.find((t) => t.id === p.team)?.name}`,
    p.officer && `Petugas: ${data.officers.find((o) => o.id === p.officer)?.name}`,
    p.status && `Status: ${STATUS[p.status].label}`,
    p.q && `Cari: "${p.q}"`,
  ].filter(Boolean);

  return (
    <>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Jadwal Kegiatan Tim Kerja</h1>
          <p className="text-sm text-slate-600">
            {monthLabel(p.from)} – {monthLabel(p.to)}
            {filters.length > 0 && ` · ${filters.join(" · ")}`}
          </p>
        </div>
        <PrintButton />
      </div>
      <ScheduleBoard data={data} isAdmin={false} currentWeek={mondayOf(today)} readOnly />
      <p className="mt-2 text-[10px] text-slate-500">
        Keterangan: {Object.values(STATUS).map((s) => `${s.symbol} ${s.label}`).join(" · ")} — dicetak {today}
      </p>
    </>
  );
}

export default function CetakPage({ searchParams }: PageProps<"/cetak">) {
  return (
    <main className="bg-white p-4 text-[10px] print:p-0">
      <Suspense fallback={<p className="text-sm">Menyiapkan dokumen…</p>}>
        <PrintView searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
