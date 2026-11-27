import Link from "next/link";
import type { TaskStatus } from "@/db/schema";
import type { StatusCounts } from "@/lib/dashboard";
import { STACK_ORDER, STATUS, STATUS_COLOR } from "@/lib/labels";

/** Batas atas sumbu yang "rapi" (1, 2, 5 × 10^k) dengan 4 garis bantu. */
function niceScale(max: number): { top: number; ticks: number[] } {
  if (max <= 0) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw)!;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: Array.from({ length: top / step + 1 }, (_, i) => i * step) };
}

export function StatusLegend({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 ${className}`}>
      {STACK_ORDER.map((s) => (
        <li key={s} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLOR[s] }} />
          <span aria-hidden>{STATUS[s].symbol}</span>
          {STATUS[s].label}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ title, counts }: { title: string; counts: StatusCounts }) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-44 -translate-x-1/2 rounded-lg bg-slate-900 p-2.5 text-left text-xs text-white shadow-xl group-hover:block group-focus-visible:block"
    >
      <p className="mb-1 font-semibold">{title}</p>
      {STACK_ORDER.map((s) => (
        <p key={s} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: STATUS_COLOR[s] }} />
          <span className="flex-1">{STATUS[s].label}</span>
          <span className="font-semibold tabular-nums">{counts[s]}</span>
        </p>
      ))}
      <p className="mt-1 flex border-t border-white/20 pt-1">
        <span className="flex-1">Total</span>
        <span className="font-semibold tabular-nums">{counts.total}</span>
      </p>
    </div>
  );
}

/** Bar bertumpuk per bulan (status). Kolom = tautan ke jadwal bulan itu. */
export function MonthlyChart({
  months,
  currentMonth,
  hrefFor,
}: {
  months: { month: string; label: string; counts: StatusCounts }[];
  currentMonth: string;
  hrefFor: (month: string) => string;
}) {
  const { top, ticks } = niceScale(Math.max(...months.map((m) => m.counts.total)));
  const H = 200;

  return (
    <div>
      <div className="relative mt-6 flex items-start" style={{ height: H + 24 }}>
        {/* Sumbu Y & gridline */}
        <div className="relative w-7 shrink-0" style={{ height: H }}>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-1.5 -translate-y-1/2 text-[10px] text-slate-400 tabular-nums"
              style={{ bottom: (t / top) * H }}
            >
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t) => (
            <div
              key={t}
              className={`absolute inset-x-0 h-px ${t === 0 ? "bg-slate-300" : "bg-slate-100"}`}
              style={{ bottom: (t / top) * H }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 flex" style={{ height: H }}>
            {months.map((m) => {
              const present = STACK_ORDER.filter((s) => m.counts[s] > 0);
              return (
                <Link
                  key={m.month}
                  href={hrefFor(m.month)}
                  className="group relative flex flex-1 flex-col items-center justify-end rounded-md outline-none hover:bg-blue-50/60 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-300"
                  aria-label={`${m.label}: ${m.counts.total} task — ${STACK_ORDER.map((s) => `${STATUS[s].label} ${m.counts[s]}`).join(", ")}`}
                >
                  {m.counts.total > 0 && (
                    <span className="mb-0.5 text-[10px] font-medium text-slate-500 tabular-nums opacity-0 group-hover:opacity-100">
                      {m.counts.total}
                    </span>
                  )}
                  <div
                    className="flex w-[55%] max-w-7 flex-col-reverse gap-[2px] overflow-hidden rounded-t-[4px]"
                    style={{ height: (m.counts.total / top) * H }}
                  >
                    {present.map((s) => (
                      <div key={s} style={{ flexGrow: m.counts[s], flexBasis: 0, background: STATUS_COLOR[s] }} />
                    ))}
                  </div>
                  <Tooltip title={`${m.label} — ${m.counts.total} task`} counts={m.counts} />
                </Link>
              );
            })}
          </div>
          {/* Label bulan */}
          <div className="absolute inset-x-0 flex" style={{ top: H + 6 }}>
            {months.map((m) => (
              <span
                key={m.month}
                className={`flex-1 text-center text-[10px] sm:text-[11px] ${m.month === currentMonth ? "font-bold text-blue-700" : "text-slate-500"}`}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <StatusLegend />
        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-blue-700">Lihat tabel</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="text-right tabular-nums">
              <thead>
                <tr className="text-slate-600">
                  <th className="pr-3 text-left font-medium">Bulan</th>
                  {STACK_ORDER.map((s) => (
                    <th key={s} className="px-2 font-medium">{STATUS[s].label}</th>
                  ))}
                  <th className="pl-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month}>
                    <td className="pr-3 text-left">{m.label}</td>
                    {STACK_ORDER.map((s) => (
                      <td key={s} className="px-2">{m.counts[s]}</td>
                    ))}
                    <td className="pl-2 font-semibold text-slate-700">{m.counts.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </div>
  );
}

/** Bar tipis bertumpuk (bagian dari keseluruhan) untuk satu baris. */
export function ProgressBar({ counts, className = "h-2" }: { counts: StatusCounts; className?: string }) {
  if (!counts.total) return <div className={`${className} rounded-full bg-slate-100`} />;
  return (
    <div
      className={`${className} flex gap-[2px] overflow-hidden rounded-full`}
      role="img"
      aria-label={STACK_ORDER.map((s) => `${STATUS[s].label} ${counts[s]}`).join(", ")}
    >
      {STACK_ORDER.filter((s: TaskStatus) => counts[s] > 0).map((s) => (
        <div
          key={s}
          title={`${STATUS[s].label}: ${counts[s]}`}
          style={{ flexGrow: counts[s], flexBasis: 0, background: STATUS_COLOR[s] }}
        />
      ))}
    </div>
  );
}
