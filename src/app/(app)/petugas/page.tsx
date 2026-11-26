import { Suspense } from "react";
import type { Metadata } from "next";
import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { officers, taskOfficers, teams } from "@/db/schema";
import { deleteOfficer, saveOfficer } from "@/app/actions/master";
import { ActionForm } from "@/components/action-form";
import { requireAdminPage } from "@/lib/auth";

export const metadata: Metadata = { title: "Petugas" };

type Officer = typeof officers.$inferSelect;
type TeamOpt = { id: number; name: string };

async function OfficerList({ searchParams }: { searchParams: PageProps<"/petugas">["searchParams"] }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().toLowerCase();
  const [rows, teamRows, counts] = await Promise.all([
    db.select().from(officers).orderBy(asc(officers.name)),
    db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(asc(teams.sortOrder), asc(teams.name)),
    db.select({ officerId: taskOfficers.officerId, n: count() }).from(taskOfficers).groupBy(taskOfficers.officerId),
  ]);
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));
  const nTasks = new Map(counts.map((c) => [c.officerId, c.n]));
  const list = q
    ? rows.filter((o) =>
        [o.name, o.nip, o.position, o.phone, o.email, o.teamId ? teamName.get(o.teamId) : null].some((v) =>
          v?.toLowerCase().includes(q),
        ),
      )
    : rows;

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Tambah petugas</h2>
        <ActionForm action={saveOfficer} resetOnSuccess className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <OfficerFields teams={teamRows} />
          <div className="flex items-end">
            <button className="btn-primary w-full">Tambah</button>
          </div>
        </ActionForm>
      </section>

      <form method="get" className="flex gap-2">
        <input name="q" type="search" defaultValue={q} placeholder="Cari nama, NIP, jabatan, tim…" className="input max-w-sm" aria-label="Cari petugas" />
        <button className="btn-secondary">Cari</button>
      </form>

      <section className="card divide-y divide-slate-100">
        {list.length === 0 && <p className="p-4 text-sm text-slate-500">Tidak ada petugas.</p>}
        {list.map((o) => (
          <div key={o.id} className="flex flex-wrap items-start gap-3 p-4">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{o.name}</p>
              <p className="text-xs text-slate-500">
                {[o.nip && `NIP ${o.nip}`, o.position, o.teamId && teamName.get(o.teamId)].filter(Boolean).join(" · ") || "—"}
              </p>
              <p className="text-xs text-slate-500">
                {[o.phone, o.email].filter(Boolean).join(" · ")}
                <span className="text-slate-400"> {nTasks.get(o.id) ?? 0} task</span>
              </p>
            </div>
            <details className="w-full lg:w-auto">
              <summary className="btn-secondary cursor-pointer list-none px-2 py-1 text-xs">Ubah</summary>
              <ActionForm action={saveOfficer} className="mt-2 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <input type="hidden" name="id" value={o.id} />
                <OfficerFields d={o} teams={teamRows} />
                <div className="flex items-end">
                  <button className="btn-primary w-full">Simpan</button>
                </div>
              </ActionForm>
              <ActionForm
                action={deleteOfficer}
                confirm={`Hapus petugas "${o.name}"? Penugasan di ${nTasks.get(o.id) ?? 0} task akan dilepas.`}
                className="mt-2"
              >
                <input type="hidden" name="id" value={o.id} />
                <button className="btn-danger px-2 py-1 text-xs">Hapus petugas</button>
              </ActionForm>
            </details>
          </div>
        ))}
      </section>
    </div>
  );
}

function OfficerFields({ d, teams }: { d?: Officer; teams: TeamOpt[] }) {
  return (
    <>
      <div>
        <label className="label">Nama *</label>
        <input name="name" className="input" defaultValue={d?.name} required maxLength={200} />
      </div>
      <div>
        <label className="label">NIP</label>
        <input name="nip" className="input" defaultValue={d?.nip ?? ""} maxLength={30} inputMode="numeric" />
      </div>
      <div>
        <label className="label">Jabatan</label>
        <input name="position" className="input" defaultValue={d?.position ?? ""} maxLength={100} />
      </div>
      <div>
        <label className="label">Telepon</label>
        <input name="phone" type="tel" className="input" defaultValue={d?.phone ?? ""} maxLength={30} />
      </div>
      <div>
        <label className="label">Email</label>
        <input name="email" type="email" className="input" defaultValue={d?.email ?? ""} />
      </div>
      <div>
        <label className="label">Tim</label>
        <select name="teamId" className="input" defaultValue={d?.teamId ?? ""}>
          <option value="">— Tanpa tim —</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
    </>
  );
}

export default function PetugasPage({ searchParams }: PageProps<"/petugas">) {
  return (
    <>
      <h1 className="mb-3 text-lg font-semibold">Petugas</h1>
      <Suspense fallback={<div className="card h-64 animate-pulse bg-slate-100" />}>
        <OfficerList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
