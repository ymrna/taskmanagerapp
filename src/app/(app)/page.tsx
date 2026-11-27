import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Icon, type IconName } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { loadDashboard, type DashboardData } from "@/lib/dashboard";
import { STATUS, STATUS_COLOR } from "@/lib/labels";
import { addMonths, shortDate, weekInfo, monthLabel } from "@/lib/weeks";
import { MonthlyChart, ProgressBar, StatusLegend } from "./dashboard-charts";

export const metadata: Metadata = { title: "Dashboard" };

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

async function Dashboard({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const user = await requireUser();
  const d = await loadDashboard(await searchParams);
  const q = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (d.team) p.set("team", String(d.team));
    for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    return p.toString();
  };
  const t = d.totals;

  return (
    <>
      <PageHeader
        icon="home"
        title={`Halo, ${user.name.split(" ")[0]} 👋`}
        subtitle={`Ringkasan kegiatan tim tahun ${d.year}${d.team ? ` · ${d.teams.find((x) => x.id === d.team)?.name}` : ""}`}
        actions={
          <Link href={`/jadwal?${q({ from: d.currentMonth, to: addMonths(d.currentMonth, 2) })}`} className="btn-primary">
            <Icon name="calendar" className="h-4 w-4" /> Buka Jadwal
          </Link>
        }
      />

      <Filters d={d} />

      {/* Stat tiles */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat
          icon="list"
          label="Total task"
          value={t.total}
          note={`${d.thisWeek} task minggu ini`}
          tone="bg-blue-700"
        />
        <Stat
          icon="check"
          label="Selesai"
          value={t.selesai}
          note={`${pct(t.selesai, t.total)}% dari total`}
          tone="bg-emerald-600"
        />
        <Stat icon="clock" label="Belum" value={t.belum} note="menunggu dikerjakan" tone="bg-slate-600" />
        <Stat icon="swap" label="Diganti" value={t.diganti} note="jadwal ulang / ganti" tone="bg-amber-500" />
        <Stat icon="x" label="Tidak dikerjakan" value={t.tidak_dikerjakan} note="dibatalkan" tone="bg-rose-600" />
        <Stat
          icon="alert"
          label="Terlambat"
          value={d.overdue}
          note="belum, minggu sudah lewat"
          tone={d.overdue ? "bg-purple-600" : "bg-slate-400"}
        />
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-3">
        <section className="card min-w-0 p-5 xl:col-span-2">
          <SectionTitle title="Jumlah task per bulan" subtitle="Klik bulan untuk membuka jadwalnya" />
          <MonthlyChart
            months={d.months}
            currentMonth={d.currentMonth}
            hrefFor={(m) => `/jadwal?${q({ from: m, to: m })}`}
          />
        </section>

        <section className="card flex min-w-0 flex-col p-5">
          <SectionTitle title="Progres keseluruhan" subtitle={`${t.total} task di ${d.year}`} />
          <div className="mb-4 flex items-end gap-3">
            <span className="text-5xl font-bold tracking-tight text-slate-900 tabular-nums">{pct(t.selesai, t.total)}%</span>
            <span className="mb-1.5 text-sm text-slate-500">selesai</span>
          </div>
          <ProgressBar counts={t} className="h-3" />
          <ul className="mt-4 space-y-2 text-sm">
            {(["selesai", "diganti", "tidak_dikerjakan", "belum"] as const).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLOR[s] }} />
                <span aria-hidden className="w-4 text-center text-slate-500">{STATUS[s].symbol}</span>
                <span className="flex-1 text-slate-600">{STATUS[s].label}</span>
                <span className="font-semibold text-slate-900 tabular-nums">{t[s]}</span>
                <span className="w-10 text-right text-xs text-slate-400 tabular-nums">{pct(t[s], t.total)}%</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="card min-w-0 p-5 xl:col-span-2">
          <SectionTitle title="Task per kegiatan" subtitle={`Tahun ${d.year}`} right={<StatusLegend />} />
          {d.perActivity.length === 0 ? (
            <Empty text="Belum ada kegiatan." />
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-500">
                    <th className="px-5 py-2 text-left font-medium">Kegiatan</th>
                    <th className="px-2 py-2 text-right font-medium">Total</th>
                    <th className="px-2 py-2 text-right font-medium" title="Selesai">✓</th>
                    <th className="px-2 py-2 text-right font-medium" title="Belum">○</th>
                    <th className="px-2 py-2 text-right font-medium" title="Diganti / Tidak dikerjakan">↻ / ✕</th>
                    <th className="w-[32%] px-5 py-2 text-left font-medium">Progres</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {d.perActivity.map((a) => (
                    <tr key={a.id} className="hover:bg-blue-50/40">
                      <td className="px-5 py-2.5">
                        <Link href={`/jadwal?team=${a.teamId}&from=${d.year}-01&to=${d.year}-12`} className="hover:text-blue-700">
                          <span className="block font-medium text-slate-800">{a.name}</span>
                          <span className="block text-xs text-slate-400">{a.teamName}</span>
                        </Link>
                      </td>
                      <td className="px-2 text-right font-semibold tabular-nums">{a.counts.total}</td>
                      <td className="px-2 text-right text-emerald-700 tabular-nums">{a.counts.selesai}</td>
                      <td className="px-2 text-right text-slate-600 tabular-nums">{a.counts.belum}</td>
                      <td className="px-2 text-right text-slate-500 tabular-nums">
                        {a.counts.diganti} / {a.counts.tidak_dikerjakan}
                      </td>
                      <td className="px-5">
                        <div className="flex items-center gap-2">
                          <ProgressBar counts={a.counts} className="h-2 flex-1" />
                          <span className="w-9 text-right text-xs text-slate-500 tabular-nums">
                            {pct(a.counts.selesai, a.counts.total)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card min-w-0 p-5">
          <SectionTitle title="Kegiatan mendatang" subtitle="Task berstatus Belum mulai minggu ini" />
          {d.upcoming.length === 0 ? (
            <Empty text="Tidak ada task mendatang." />
          ) : (
            <ul className="space-y-3">
              {d.upcoming.map((u) => {
                const w = weekInfo(u.weekStart);
                const diff = Math.round(
                  (Date.parse(u.weekStart) - Date.parse(d.currentWeek)) / (7 * 86_400_000),
                );
                const when = diff === 0 ? "Minggu ini" : diff === 1 ? "Minggu depan" : `${diff} minggu lagi`;
                return (
                  <li key={u.id}>
                    <Link
                      href={`/jadwal?from=${w.month}&to=${w.month}`}
                      className="flex gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      <span
                        className={`grid w-14 shrink-0 place-items-center rounded-lg py-1.5 text-center leading-tight ${
                          diff === 0 ? "bg-blue-700 text-white" : "bg-blue-50 text-blue-800"
                        }`}
                      >
                        <span className="text-[10px] font-semibold uppercase">M{w.index}</span>
                        <span className="text-xs font-bold">{monthLabel(w.month, true).split(" ")[0]}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-slate-800">{u.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {u.teamName} · {u.activityName}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className={`rounded-full px-2 py-0.5 font-medium ${diff === 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                            {when}
                          </span>
                          <span className="text-slate-400">
                            {shortDate(w.start)}–{shortDate(w.end)}
                          </span>
                        </span>
                        {u.officers.length > 0 && (
                          <span className="mt-1 block truncate text-[11px] text-slate-500">👤 {u.officers.join(", ")}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Filters({ d }: { d: DashboardData }) {
  const yearHref = (y: number) => `/?year=${y}${d.team ? `&team=${d.team}` : ""}`;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
        <Link href={yearHref(d.year - 1)} className="rounded-md px-2.5 py-1.5 text-slate-500 hover:bg-slate-100" aria-label="Tahun sebelumnya">
          ‹
        </Link>
        <span className="px-3 text-sm font-semibold text-slate-800 tabular-nums">{d.year}</span>
        <Link href={yearHref(d.year + 1)} className="rounded-md px-2.5 py-1.5 text-slate-500 hover:bg-slate-100" aria-label="Tahun berikutnya">
          ›
        </Link>
      </div>
      <form method="get" className="flex items-center gap-2">
        <input type="hidden" name="year" value={d.year} />
        <select name="team" defaultValue={d.team ?? ""} className="input w-48 py-1.5" aria-label="Filter tim">
          <option value="">Semua tim</option>
          {d.teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button className="btn-secondary py-1.5">Terapkan</button>
      </form>
    </div>
  );
}

function Stat({ icon, label, value, note, tone }: { icon: IconName; label: string; value: number; note: string; tone: string }) {
  return (
    <div className="card relative overflow-hidden p-4">
      <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full opacity-10 ${tone}`} />
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 place-items-center rounded-lg text-white shadow-sm ${tone}`}>
          <Icon name={icon} className="h-4.5 w-4.5" />
        </span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{note}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500">{text}</p>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-12 w-72 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card h-32 animate-pulse bg-slate-100" />
        ))}
      </div>
      <div className="card h-80 animate-pulse bg-slate-100" />
    </div>
  );
}

export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}
