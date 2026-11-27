"use client";

import { useState } from "react";
import { deleteOfficer, saveOfficer } from "@/app/actions/master";
import { ActionForm } from "@/components/action-form";

export type OfficerRow = { id: number; name: string; position: string | null; teamId: number | null; tasks: number };
type TeamOpt = { id: number; name: string };

/** Tabel petugas (Nama · Tim · Jabatan) dengan ubah langsung di baris. */
export function OfficersTable({ rows, teams }: { rows: OfficerRow[]; teams: TeamOpt[] }) {
  const [editing, setEditing] = useState<number | null>(null);
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  if (!rows.length) return <p className="p-6 text-center text-sm text-slate-500">Tidak ada petugas.</p>;

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase">
            <th className="w-[34%] px-4 py-3">Nama</th>
            <th className="w-[26%] px-4 py-3">Tim</th>
            <th className="w-[26%] px-4 py-3">Jabatan</th>
            <th className="px-4 py-3 text-right">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((o) => {
            const formId = `petugas-${o.id}`;
            if (editing === o.id) {
              return (
                <tr key={o.id} className="bg-blue-50/50 align-top">
                  <td className="px-4 py-2">
                    <input form={formId} name="name" className="input py-1.5" defaultValue={o.name} required maxLength={200} aria-label="Nama" autoFocus />
                  </td>
                  <td className="px-4 py-2">
                    <select form={formId} name="teamId" className="input py-1.5" defaultValue={o.teamId ?? ""} aria-label="Tim">
                      <option value="">— Tanpa tim —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input form={formId} name="position" className="input py-1.5" defaultValue={o.position ?? ""} maxLength={100} aria-label="Jabatan" />
                  </td>
                  <td className="px-4 py-2">
                    <ActionForm id={formId} action={saveOfficer} quiet onSuccess={() => setEditing(null)} className="flex flex-wrap justify-end gap-2">
                      <input type="hidden" name="id" value={o.id} />
                      <button type="button" className="btn-secondary px-2.5 py-1.5 text-xs" onClick={() => setEditing(null)}>
                        Batal
                      </button>
                      <button className="btn-primary px-2.5 py-1.5 text-xs">Simpan</button>
                    </ActionForm>
                  </td>
                </tr>
              );
            }
            return (
              <tr key={o.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800">{o.name}</span>
                  <span className="block text-xs text-slate-400">{o.tasks} task</span>
                </td>
                <td className="px-4 py-3">
                  {o.teamId ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">{teamName.get(o.teamId)}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{o.position || <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <button type="button" className="btn-secondary px-2.5 py-1 text-xs" onClick={() => setEditing(o.id)}>
                      Ubah
                    </button>
                    <ActionForm
                      action={deleteOfficer}
                      quiet
                      confirm={`Hapus petugas "${o.name}"? Penugasan di ${o.tasks} task akan dilepas.`}
                      className="flex flex-col items-end"
                    >
                      <input type="hidden" name="id" value={o.id} />
                      <button className="btn-danger px-2.5 py-1 text-xs">Hapus</button>
                    </ActionForm>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
