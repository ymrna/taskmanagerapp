import { Suspense } from "react";
import type { Metadata } from "next";
import { asc, count } from "drizzle-orm";
import { db } from "@/db";
import { officers, taskOfficers, teams } from "@/db/schema";
import { saveOfficer } from "@/app/actions/master";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireAdminPage } from "@/lib/auth";
import { OfficersTable } from "./officers-table";

export const metadata: Metadata = { title: "Petugas" };

async function OfficerList({ searchParams }: { searchParams: PageProps<"/petugas">["searchParams"] }) {
  await requireAdminPage();
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().toLowerCase();
  const [rows, teamRows, counts] = await Promise.all([
    db
      .select({ id: officers.id, name: officers.name, position: officers.position, teamId: officers.teamId })
      .from(officers)
      .orderBy(asc(officers.name)),
    db.select({ id: teams.id, name: teams.name }).from(teams).orderBy(asc(teams.sortOrder), asc(teams.name)),
    db.select({ officerId: taskOfficers.officerId, n: count() }).from(taskOfficers).groupBy(taskOfficers.officerId),
  ]);
  const teamName = new Map(teamRows.map((t) => [t.id, t.name]));
  const nTasks = new Map(counts.map((c) => [c.officerId, c.n]));
  const list = rows
    .filter(
      (o) =>
        !q ||
        [o.name, o.position, o.teamId ? teamName.get(o.teamId) : null].some((v) => v?.toLowerCase().includes(q)),
    )
    .map((o) => ({ ...o, tasks: nTasks.get(o.id) ?? 0 }));

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Tambah petugas</h2>
        <ActionForm action={saveOfficer} resetOnSuccess className="grid items-end gap-2 sm:grid-cols-[2fr_1.5fr_1.5fr_auto]">
          <div>
            <label className="label" htmlFor="new-name">Nama *</label>
            <input id="new-name" name="name" className="input" required maxLength={200} />
          </div>
          <div>
            <label className="label" htmlFor="new-team">Tim</label>
            <select id="new-team" name="teamId" className="input" defaultValue="">
              <option value="">— Tanpa tim —</option>
              {teamRows.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="new-position">Jabatan</label>
            <input id="new-position" name="position" className="input" maxLength={100} />
          </div>
          <button className="btn-primary">Tambah</button>
        </ActionForm>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-4">
          <h2 className="font-semibold">
            Daftar petugas <span className="text-sm font-normal text-slate-400">({list.length})</span>
          </h2>
          <form method="get" className="flex gap-2">
            <input name="q" type="search" defaultValue={q} placeholder="Cari nama, tim, jabatan…" className="input w-56 py-1.5" aria-label="Cari petugas" />
            <button className="btn-secondary py-1.5">Cari</button>
          </form>
        </div>
        <OfficersTable rows={list} teams={teamRows} />
      </section>
    </div>
  );
}

export default function PetugasPage({ searchParams }: PageProps<"/petugas">) {
  return (
    <>
      <PageHeader icon="badge" title="Petugas" subtitle="Data petugas yang dapat ditugaskan ke task." />
      <Suspense fallback={<div className="card h-64 animate-pulse bg-slate-100" />}>
        <OfficerList searchParams={searchParams} />
      </Suspense>
    </>
  );
}
