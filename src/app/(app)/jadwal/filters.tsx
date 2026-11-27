import Link from "next/link";
import type { ScheduleData } from "@/lib/schedule";
import { paramsToQuery } from "@/lib/schedule";
import { STATUS, STATUS_KEYS } from "@/lib/labels";
import { addMonths } from "@/lib/weeks";

/** Filter berupa form GET biasa: tetap jalan tanpa JavaScript & bisa di-bookmark. */
export function ScheduleFilters({ data, currentMonth }: { data: ScheduleData; currentMonth: string }) {
  const p = data.params;
  const year = currentMonth.slice(0, 4);
  const q1 = Math.floor((Number(currentMonth.slice(5)) - 1) / 3) * 3 + 1;
  const quarterStart = `${year}-${String(q1).padStart(2, "0")}`;
  const semStart = `${year}-${Number(currentMonth.slice(5)) <= 6 ? "01" : "07"}`;
  const presets = [
    { label: "Bulan ini", from: currentMonth, to: currentMonth },
    { label: "Triwulan ini", from: quarterStart, to: addMonths(quarterStart, 2) },
    { label: "Semester ini", from: semStart, to: addMonths(semStart, 5) },
    { label: `Tahun ${year}`, from: `${year}-01`, to: `${year}-12` },
  ];
  const keep = { ...p };
  const active = Boolean(p.team || p.officer || p.status || p.q);
  const query = paramsToQuery(p);

  return (
    <div className="no-print mb-3 space-y-2">
      <form method="get" className="card flex flex-wrap items-end gap-2 p-3">
        <div className="w-[9.5rem]">
          <label className="label" htmlFor="from">Dari bulan</label>
          <input id="from" name="from" type="month" className="input py-1.5" defaultValue={p.from} required />
        </div>
        <div className="w-[9.5rem]">
          <label className="label" htmlFor="to">Sampai bulan</label>
          <input id="to" name="to" type="month" className="input py-1.5" defaultValue={p.to} required />
        </div>
        <div className="w-40">
          <label className="label" htmlFor="team">Tim</label>
          <select id="team" name="team" className="input py-1.5" defaultValue={p.team ?? ""}>
            <option value="">Semua tim</option>
            {data.allTeams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="label" htmlFor="officer">Petugas</label>
          <select id="officer" name="officer" className="input py-1.5" defaultValue={p.officer ?? ""}>
            <option value="">Semua petugas</option>
            {data.officers.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="w-36">
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" className="input py-1.5" defaultValue={p.status ?? ""}>
            <option value="">Semua status</option>
            {STATUS_KEYS.map((k) => (
              <option key={k} value={k}>{STATUS[k].label}</option>
            ))}
          </select>
        </div>
        <div className="min-w-40 flex-1">
          <label className="label" htmlFor="q">Cari</label>
          <input id="q" name="q" type="search" className="input py-1.5" defaultValue={p.q} placeholder="Task, kegiatan, tim…" />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary py-1.5">Terapkan</button>
          {active && (
            <Link className="btn-secondary py-1.5" href={`/jadwal?from=${p.from}&to=${p.to}`}>
              Reset
            </Link>
          )}
        </div>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Rentang cepat:</span>
        {presets.map((pr) => {
          const href = `/jadwal?${paramsToQuery({ ...keep, from: pr.from, to: pr.to })}`;
          const on = p.from === pr.from && p.to === pr.to;
          return (
            <Link
              key={pr.label}
              href={href}
              className={`rounded-full border px-2.5 py-1 ${on ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {pr.label}
            </Link>
          );
        })}
        <span className="ml-auto flex gap-2">
          <a className="btn-secondary px-2.5 py-1 text-xs" href={`/api/export?${query}`}>
            ⬇ Excel
          </a>
          <a className="btn-secondary px-2.5 py-1 text-xs" href={`/cetak?${query}`} target="_blank" rel="noopener">
            ⎙ PDF / Cetak
          </a>
        </span>
      </div>
    </div>
  );
}
