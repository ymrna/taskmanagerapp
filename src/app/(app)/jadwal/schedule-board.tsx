"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ScheduleData, TaskView } from "@/lib/schedule";
import { STATUS } from "@/lib/labels";
import { shortDate, weekInfo, monthLabel } from "@/lib/weeks";
import { TaskDialog, type DialogTarget } from "./task-dialog";

type Props = {
  data: ScheduleData;
  isAdmin: boolean;
  currentWeek: string;
  /** Mode cetak: tanpa tombol & interaksi. */
  readOnly?: boolean;
};

const shortWeek = (start: string) => {
  const w = weekInfo(start);
  return `M${w.index} ${monthLabel(w.month, true)}`;
};

export function ScheduleBoard({ data, isAdmin, currentWeek, readOnly }: Props) {
  const [target, setTarget] = useState<DialogTarget | null>(null);
  const weeks = data.months.flatMap((m) => m.weeks);

  const byCell = useMemo(() => {
    const map = new Map<string, TaskView[]>();
    for (const t of data.tasks) {
      const key = `${t.activityId}|${t.weekStart}`;
      map.set(key, [...(map.get(key) ?? []), t]);
    }
    return map;
  }, [data.tasks]);

  const officerName = useMemo(() => new Map(data.officers.map((o) => [o.id, o.name])), [data.officers]);

  if (!data.teams.length) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        {data.filtered || data.params.team ? (
          "Tidak ada task yang cocok dengan filter."
        ) : isAdmin ? (
          <>
            Belum ada tim kerja.{" "}
            <Link href="/tim" className="text-blue-700 underline">
              Tambahkan tim & kegiatan
            </Link>
            .
          </>
        ) : (
          "Belum ada tim kerja."
        )}
      </div>
    );
  }

  // Lebar kolom tetap agar kolom sticky bisa ditumpuk.
  // Di HP kolom Tim disembunyikan (nama tim tampil di sel kegiatan) agar lebih banyak minggu terlihat.
  const teamCol = readOnly ? "w-28 min-w-28" : "left-0 hidden w-36 min-w-36 sm:table-cell";
  const actCol = readOnly ? "w-36 min-w-36" : "left-0 w-32 min-w-32 sm:left-36 sm:w-48 sm:min-w-48";
  const sticky = readOnly ? "" : "sticky";

  return (
    <>
      <div className={readOnly ? "" : "card max-h-[calc(100dvh-14rem)] min-h-64 overflow-auto"}>
        <table className="w-full border-separate border-spacing-0 text-xs sm:text-sm">
          <thead className={readOnly ? "" : "sticky top-0 z-20"}>
            <tr>
              <th rowSpan={2} className={`${sticky} ${teamCol} z-10 border-r border-b border-slate-200 bg-slate-100 p-2 text-left`}>
                Tim Kerja
              </th>
              <th rowSpan={2} className={`${sticky} ${actCol} z-10 border-r border-b border-slate-200 bg-slate-100 p-2 text-left`}>
                Kegiatan
              </th>
              {data.months.map((m) => (
                <th
                  key={m.month}
                  colSpan={m.weeks.length}
                  className="border-r border-b border-slate-200 bg-slate-100 p-1.5 text-center font-semibold"
                >
                  {m.label}
                </th>
              ))}
            </tr>
            <tr>
              {weeks.map((w) => (
                <th
                  key={w.start}
                  title={`${shortDate(w.start)} – ${shortDate(w.end)}`}
                  className={`min-w-28 border-r border-b border-slate-200 p-1 text-center font-medium sm:min-w-32 ${
                    w.start === currentWeek ? "bg-blue-100 text-blue-900" : "bg-slate-50"
                  }`}
                >
                  M{w.index}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {shortDate(w.start)}–{shortDate(w.end)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team) => {
              const rows = team.activities.length ? team.activities : [null];
              return rows.map((act, i) => (
                <tr key={`${team.id}-${act?.id ?? "x"}`} className="align-top">
                  {i === 0 && (
                    <th
                      rowSpan={rows.length}
                      scope="rowgroup"
                      className={`${sticky} ${teamCol} z-[5] border-r border-b border-slate-200 bg-white p-2 text-left font-semibold`}
                    >
                      {team.name}
                    </th>
                  )}
                  <th
                    scope="row"
                    className={`${sticky} ${actCol} z-[5] border-r border-b border-slate-200 bg-white p-2 text-left font-normal`}
                    title={act?.description ?? undefined}
                  >
                    {!readOnly && <span className="block text-[10px] font-semibold text-slate-500 sm:hidden">{team.name}</span>}
                    {act ? act.name : <span className="text-slate-400 italic">Belum ada kegiatan</span>}
                  </th>
                  {weeks.map((w) => {
                    const cellTasks = act ? (byCell.get(`${act.id}|${w.start}`) ?? []) : [];
                    return (
                      <td
                        key={w.start}
                        className={`group border-r border-b border-slate-200 p-1 ${
                          w.start === currentWeek ? "bg-blue-50/60" : ""
                        }`}
                      >
                        <div className="flex min-h-10 flex-col gap-1">
                          {cellTasks.map((t) => (
                            <TaskChip
                              key={t.id}
                              task={t}
                              officerName={officerName}
                              readOnly={readOnly}
                              onOpen={() => act && setTarget({ kind: "edit", task: t, activity: act, teamName: team.name, teamId: team.id })}
                            />
                          ))}
                          {act && isAdmin && !readOnly && (
                            <button
                              type="button"
                              onClick={() =>
                                setTarget({ kind: "new", activity: act, teamName: team.name, teamId: team.id, weekStart: w.start })
                              }
                              className="rounded border border-dashed border-transparent py-0.5 text-slate-400 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:border-blue-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                              aria-label={`Tambah task ${act.name} minggu ${shortDate(w.start)}`}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && <Legend />}

      {target && (
        <TaskDialog
          key={target.kind === "edit" ? `e${target.task.id}` : `n${target.activity.id}${target.weekStart}`}
          target={target}
          officers={data.officers}
          isAdmin={isAdmin}
          onClose={() => setTarget(null)}
        />
      )}
    </>
  );
}

function TaskChip({
  task,
  officerName,
  onOpen,
  readOnly,
}: {
  task: TaskView;
  officerName: Map<number, string>;
  onOpen: () => void;
  readOnly?: boolean;
}) {
  const s = STATUS[task.status];
  const names = task.officerIds.map((id) => officerName.get(id)).filter(Boolean) as string[];
  const content = (
    <>
      <span className="flex items-start gap-1">
        <span aria-hidden className="shrink-0">{s.symbol}</span>
        <span className={readOnly ? "" : "line-clamp-3"}>{task.title}</span>
      </span>
      {task.status === "diganti" && task.replacementType === "jadwal_ulang" && task.replacementWeek && (
        <span className="block text-[10px] no-underline">→ dijadwal ulang ke {shortWeek(task.replacementWeek)}</span>
      )}
      {task.status === "diganti" && task.replacementType === "ganti_kegiatan" && (
        <span className="block text-[10px]">⇄ diganti: {task.replacementActivity}</span>
      )}
      {task.fromWeek && <span className="block text-[10px] text-slate-500">← jadwal ulang dari {shortWeek(task.fromWeek)}</span>}
      {names.length > 0 && (
        <span className="mt-0.5 block truncate text-[10px] text-slate-500" title={names.join(", ")}>
          👤 {names.join(", ")}
        </span>
      )}
    </>
  );
  const cls = `block w-full rounded border px-1.5 py-1 text-left leading-snug ${s.chip}`;
  if (readOnly) return <div className={cls}>{content}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`${cls} hover:ring-2 hover:ring-blue-200 focus:ring-2 focus:ring-blue-300 focus:outline-none`}
      aria-label={`${task.title} — ${s.label}`}
    >
      {content}
    </button>
  );
}

function Legend() {
  return (
    <ul className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
      {Object.entries(STATUS).map(([k, s]) => (
        <li key={k} className="flex items-center gap-1">
          <span className={`inline-block rounded border px-1 ${s.chip}`}>{s.symbol}</span> {s.label}
        </li>
      ))}
      <li className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded bg-blue-100" /> Minggu ini
      </li>
    </ul>
  );
}
