import { Suspense } from "react";
import type { Metadata } from "next";
import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { activities, tasks, teams } from "@/db/schema";
import { deleteActivity, deleteTeam, saveActivity, saveTeam } from "@/app/actions/master";
import { ActionForm } from "@/components/action-form";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Tim & Kegiatan" };

async function TeamList() {
  await requireAdminPage();
  const [teamRows, actRows, taskCounts] = await Promise.all([
    db.select().from(teams).orderBy(asc(teams.sortOrder), asc(teams.name)),
    db.select().from(activities).orderBy(asc(activities.sortOrder), asc(activities.name)),
    db.select({ activityId: tasks.activityId, n: count() }).from(tasks).groupBy(tasks.activityId),
  ]);
  const nTasks = new Map(taskCounts.map((r) => [r.activityId, r.n]));

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Tambah tim kerja</h2>
        <ActionForm action={saveTeam} resetOnSuccess className="flex flex-wrap items-end gap-2">
          <TeamFields />
          <button className="btn-primary">Tambah tim</button>
        </ActionForm>
      </section>

      {teamRows.length === 0 && <p className="text-sm text-slate-500">Belum ada tim.</p>}

      {teamRows.map((team) => {
        const acts = actRows.filter((a) => a.teamId === team.id);
        return (
          <section key={team.id} className="card">
            <div className="flex flex-wrap items-start gap-3 border-b border-slate-100 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{team.name}</h2>
                {team.description && <p className="text-sm text-slate-500">{team.description}</p>}
              </div>
              <details className="w-full sm:w-auto">
                <summary className="btn-secondary cursor-pointer list-none px-2 py-1 text-xs">Ubah tim</summary>
                <ActionForm action={saveTeam} className="mt-2 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={team.id} />
                  <TeamFields d={team} />
                  <button className="btn-primary">Simpan</button>
                </ActionForm>
                <ActionForm
                  action={deleteTeam}
                  confirm={`Hapus tim "${team.name}" beserta ${acts.length} kegiatan dan semua task-nya?`}
                  className="mt-2"
                >
                  <input type="hidden" name="id" value={team.id} />
                  <button className="btn-danger px-2 py-1 text-xs">Hapus tim</button>
                </ActionForm>
              </details>
            </div>

            <ul className="divide-y divide-slate-100">
              {acts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-start gap-3 px-4 py-2">
                  <div className="min-w-0 flex-1 text-sm">
                    <p>{a.name}</p>
                    {a.description && <p className="text-xs text-slate-500">{a.description}</p>}
                    <p className="text-xs text-slate-400">{nTasks.get(a.id) ?? 0} task · urutan {a.sortOrder}</p>
                  </div>
                  <details className="w-full sm:w-auto">
                    <summary className="btn-secondary cursor-pointer list-none px-2 py-1 text-xs">Ubah</summary>
                    <ActionForm action={saveActivity} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="teamId" value={team.id} />
                      <ActivityFields d={a} />
                      <button className="btn-primary">Simpan</button>
                    </ActionForm>
                    <ActionForm
                      action={deleteActivity}
                      confirm={`Hapus kegiatan "${a.name}" dan ${nTasks.get(a.id) ?? 0} task-nya?`}
                      className="mt-2"
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <button className="btn-danger px-2 py-1 text-xs">Hapus kegiatan</button>
                    </ActionForm>
                  </details>
                </li>
              ))}
              <li className="bg-slate-50 px-4 py-3">
                <ActionForm action={saveActivity} resetOnSuccess className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="teamId" value={team.id} />
                  <ActivityFields />
                  <button className="btn-secondary">+ Kegiatan</button>
                </ActionForm>
              </li>
            </ul>
          </section>
        );
      })}
    </div>
  );
}

type Item = { name: string; description: string | null; sortOrder: number };

function TeamFields({ d }: { d?: Item }) {
  return <ItemFields d={d} nameLabel="Nama tim" />;
}
function ActivityFields({ d }: { d?: Item }) {
  return <ItemFields d={d} nameLabel="Nama kegiatan" />;
}
function ItemFields({ d, nameLabel }: { d?: Item; nameLabel: string }) {
  return (
    <>
      <div className="min-w-48 flex-1">
        <label className="label">{nameLabel} *</label>
        <input name="name" className="input" defaultValue={d?.name} required maxLength={200} />
      </div>
      <div className="min-w-48 flex-[2]">
        <label className="label">Keterangan</label>
        <input name="description" className="input" defaultValue={d?.description ?? ""} maxLength={500} />
      </div>
      <div className="w-20">
        <label className="label">Urutan</label>
        <input name="sortOrder" type="number" min={0} className="input" defaultValue={d?.sortOrder ?? 0} />
      </div>
    </>
  );
}

export default function TimPage() {
  return (
    <>
      <h1 className="mb-3 text-lg font-semibold">Tim Kerja & Kegiatan</h1>
      <Suspense fallback={<div className="card h-64 animate-pulse bg-slate-100" />}>
        <TeamList />
      </Suspense>
    </>
  );
}
