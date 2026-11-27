"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deleteTask, saveTask, updateTaskStatus } from "@/app/actions/tasks";
import { ActionForm } from "@/components/action-form";
import type { TaskStatus, ReplacementType } from "@/db/schema";
import { REPLACEMENT, STATUS, STATUS_KEYS } from "@/lib/labels";
import type { ActivityRow, OfficerOption, TaskView } from "@/lib/schedule";
import { addDays, monthOfWeek, shortDate, weekLabel, weeksOfMonth } from "@/lib/weeks";

export type DialogTarget =
  | { kind: "new"; activity: ActivityRow; teamName: string; teamId: number; weekStart: string }
  | { kind: "edit"; task: TaskView; activity: ActivityRow; teamName: string; teamId: number };

type Props = {
  target: DialogTarget;
  officers: OfficerOption[];
  isAdmin: boolean;
  onClose: () => void;
};

export function TaskDialog({ target, officers, isAdmin, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, []);

  const task = target.kind === "edit" ? target.task : null;
  const weekStart = task ? task.weekStart : (target as { weekStart: string }).weekStart;

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto max-h-[92dvh] w-[min(40rem,96vw)] rounded-xl p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className="sticky top-0 z-10 flex items-start gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{task ? (isAdmin ? "Ubah task" : "Detail task") : "Tambah task"}</h2>
          <p className="truncate text-xs text-slate-500">
            {target.teamName} · {target.activity.name} · {weekLabel(weekStart)}
          </p>
        </div>
        <button type="button" className="btn-secondary px-2 py-1" onClick={() => ref.current?.close()} aria-label="Tutup">
          ✕
        </button>
      </div>

      <ActionForm
        action={isAdmin ? saveTask : updateTaskStatus}
        onSuccess={() => ref.current?.close()}
        quiet
        className="space-y-4 px-4 py-4"
      >
        <input type="hidden" name="id" value={task?.id ?? ""} />
        <input type="hidden" name="activityId" value={target.activity.id} />
        <input type="hidden" name="weekStart" value={weekStart} />

        {isAdmin ? (
          <>
            <div>
              <label className="label" htmlFor="title">Judul task *</label>
              <input id="title" name="title" className="input" defaultValue={task?.title} required maxLength={200} autoFocus={!task} />
            </div>
            <div>
              <label className="label" htmlFor="notes">Catatan</label>
              <textarea id="notes" name="notes" className="input" rows={2} defaultValue={task?.notes ?? ""} maxLength={1000} />
            </div>
            <OfficerPicker officers={officers} teamId={target.teamId} initial={task?.officerIds ?? []} />
          </>
        ) : (
          task && <ReadOnlyDetails task={task} officers={officers} />
        )}

        {(task || isAdmin) && (
          <StatusFields task={task} weekStart={weekStart} />
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button type="button" className="btn-secondary" onClick={() => ref.current?.close()}>
            Batal
          </button>
          <button className="btn-primary">{task ? "Simpan" : "Tambah"}</button>
        </div>
      </ActionForm>

      {isAdmin && task && (
        <ActionForm
          action={deleteTask}
          confirm={`Hapus task "${task.title}"?`}
          onSuccess={() => ref.current?.close()}
          quiet
          className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3"
        >
          <input type="hidden" name="id" value={task.id} />
          <button className="btn-danger px-2 py-1 text-xs">Hapus task</button>
          {task.childWeek && (
            <span className="text-xs text-slate-500">Task pengganti di {weekLabel(task.childWeek)} tidak ikut terhapus.</span>
          )}
        </ActionForm>
      )}
    </dialog>
  );
}

function ReadOnlyDetails({ task, officers }: { task: TaskView; officers: OfficerOption[] }) {
  const names = officers.filter((o) => task.officerIds.includes(o.id));
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">{task.title}</p>
      {task.notes && <p className="whitespace-pre-line text-slate-600">{task.notes}</p>}
      <div>
        <span className="label">Petugas</span>
        {names.length ? (
          <ul className="flex flex-wrap gap-1">
            {names.map((o) => (
              <li key={o.id} className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                {o.name}
                {o.position && <span className="text-slate-500"> · {o.position}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">Belum ada petugas</p>
        )}
      </div>
    </div>
  );
}

function OfficerPicker({ officers, teamId, initial }: { officers: OfficerOption[]; teamId: number; initial: number[] }) {
  const [selected, setSelected] = useState(() => new Set(initial));
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return officers
      .filter((o) => !needle || o.name.toLowerCase().includes(needle) || o.position?.toLowerCase().includes(needle))
      // Anggota tim ini & yang sudah dipilih tampil lebih dulu
      .sort((a, b) => Number(b.teamId === teamId || selected.has(b.id)) - Number(a.teamId === teamId || selected.has(a.id)));
    // selected sengaja tidak jadi dependency agar urutan tidak loncat saat dicentang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officers, q, teamId]);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="label mb-0">Petugas ({selected.size} dipilih)</span>
      </div>
      {officers.length === 0 ? (
        <p className="text-xs text-slate-500">Belum ada data petugas. Tambahkan di menu Petugas.</p>
      ) : (
        <>
          {officers.length > 6 && (
            <input
              className="input mb-2 py-1.5"
              placeholder="Cari petugas…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari petugas"
            />
          )}
          <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 p-1">
            {list.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selected.has(o.id)}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) next.add(o.id);
                    else next.delete(o.id);
                    setSelected(next);
                  }}
                />
                <span>
                  {o.name}
                  {o.position && <span className="text-xs text-slate-500"> · {o.position}</span>}
                </span>
              </label>
            ))}
          </div>
          {/* Nilai terpilih dikirim walau tersembunyi oleh pencarian */}
          {[...selected].map((id) => (
            <input key={id} type="hidden" name="officerIds" value={id} />
          ))}
        </>
      )}
    </div>
  );
}

function StatusFields({ task, weekStart }: { task: TaskView | null; weekStart: string }) {
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "belum");
  const [type, setType] = useState<ReplacementType>(task?.replacementType ?? "jadwal_ulang");
  const defaultTarget = task?.replacementWeek ?? addDays(weekStart, 7);
  const [month, setMonth] = useState(task?.replacementWeek ? monthOfWeek(task.replacementWeek) : monthOfWeek(defaultTarget));
  const monthWeeks = /^\d{4}-\d{2}$/.test(month) ? weeksOfMonth(month) : [];
  const [targetWeek, setTargetWeek] = useState(defaultTarget);
  const weekValue = monthWeeks.some((w) => w.start === targetWeek) ? targetWeek : (monthWeeks.find((w) => w.start !== weekStart)?.start ?? "");

  return (
    <fieldset className="space-y-3">
      <legend className="label">Status</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STATUS_KEYS.map((k) => (
          <label
            key={k}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-2 text-sm ${
              status === k ? `${STATUS[k].chip} ring-2 ring-blue-200` : "border-slate-200 bg-white"
            }`}
          >
            <input type="radio" name="status" value={k} checked={status === k} onChange={() => setStatus(k)} className="sr-only" />
            <span aria-hidden>{STATUS[k].symbol}</span>
            {STATUS[k].label}
          </label>
        ))}
      </div>

      {status === "diganti" && (
        <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50/50 p-3">
          <div className="flex flex-wrap gap-4">
            {(Object.keys(REPLACEMENT) as ReplacementType[]).map((k) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <input type="radio" name="replacementType" value={k} checked={type === k} onChange={() => setType(k)} />
                {REPLACEMENT[k]}
              </label>
            ))}
          </div>

          {type === "jadwal_ulang" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="rw-month">Bulan tujuan</label>
                <input id="rw-month" type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="rw-week">Minggu tujuan</label>
                <select
                  id="rw-week"
                  name="replacementWeek"
                  className="input"
                  value={weekValue}
                  onChange={(e) => setTargetWeek(e.target.value)}
                  required
                >
                  {monthWeeks.map((w) => (
                    <option key={w.start} value={w.start} disabled={w.start === weekStart}>
                      M{w.index} ({shortDate(w.start)}–{shortDate(w.end)}){w.start === weekStart ? " · minggu ini" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-600 sm:col-span-2">
                {task?.childWeek
                  ? `Task pengganti sudah ada di ${weekLabel(task.childWeek)}; akan dipindah ke minggu yang dipilih.`
                  : "Task baru (status Belum) akan dibuat otomatis di minggu tujuan, lengkap dengan petugasnya."}
              </p>
            </div>
          ) : (
            <div>
              <label className="label" htmlFor="ra">Kegiatan pengganti *</label>
              <input
                id="ra"
                name="replacementActivity"
                className="input"
                defaultValue={task?.replacementActivity ?? ""}
                maxLength={200}
                required
              />
            </div>
          )}

          <div>
            <label className="label" htmlFor="rn">Alasan / keterangan</label>
            <textarea id="rn" name="replacementNote" rows={2} className="input" defaultValue={task?.replacementNote ?? ""} maxLength={500} />
          </div>
        </div>
      )}

      {task?.fromWeek && (
        <p className="text-xs text-slate-500">Task ini hasil jadwal ulang dari {weekLabel(task.fromWeek)}.</p>
      )}
    </fieldset>
  );
}
