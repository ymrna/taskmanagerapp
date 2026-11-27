import { Suspense } from "react";
import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createUser, deleteUser, updateUser } from "@/app/actions/master";
import { ActionForm } from "@/components/action-form";
import { PageHeader } from "@/components/page-header";
import { requireAdminPage } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";

export const metadata: Metadata = { title: "Pengguna" };

type U = { username: string; name: string; role: "admin" | "anggota" };

async function UserList() {
  const me = await requireAdminPage();
  const rows = await db
    .select({ id: users.id, username: users.username, name: users.name, role: users.role })
    .from(users)
    .orderBy(asc(users.username));

  return (
    <div className="space-y-4">
      <section className="card p-4">
        <h2 className="mb-1 font-semibold">Tambah pengguna</h2>
        <p className="mb-3 text-xs text-slate-500">
          Admin: kelola semua data. Anggota: melihat jadwal dan mengubah status task.
        </p>
        <ActionForm action={createUser} resetOnSuccess className="grid gap-2 sm:grid-cols-5">
          <UserFields passwordRequired />
          <div className="flex items-end">
            <button className="btn-primary w-full">Tambah</button>
          </div>
        </ActionForm>
      </section>

      <section className="card divide-y divide-slate-100">
        {rows.map((u) => (
          <div key={u.id} className="flex flex-wrap items-start gap-3 p-4">
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">
                {u.name} {u.id === me.id && <span className="text-xs text-slate-400">(Anda)</span>}
              </p>
              <p className="text-xs text-slate-500">
                @{u.username} · {ROLE_LABEL[u.role]}
              </p>
            </div>
            <details className="w-full lg:w-auto">
              <summary className="btn-secondary cursor-pointer list-none px-2 py-1 text-xs">Ubah</summary>
              <ActionForm action={updateUser} className="mt-2 grid gap-2 sm:grid-cols-5">
                <input type="hidden" name="id" value={u.id} />
                <UserFields d={u} />
                <div className="flex items-end">
                  <button className="btn-primary w-full">Simpan</button>
                </div>
              </ActionForm>
              {u.id !== me.id && (
                <ActionForm action={deleteUser} confirm={`Hapus pengguna "${u.username}"?`} className="mt-2">
                  <input type="hidden" name="id" value={u.id} />
                  <button className="btn-danger px-2 py-1 text-xs">Hapus pengguna</button>
                </ActionForm>
              )}
            </details>
          </div>
        ))}
      </section>
    </div>
  );
}

function UserFields({ d, passwordRequired }: { d?: U; passwordRequired?: boolean }) {
  return (
    <>
      <div>
        <label className="label">Username *</label>
        <input name="username" className="input" defaultValue={d?.username} required maxLength={50} autoCapitalize="none" pattern="[A-Za-z0-9._\-]+" />
      </div>
      <div>
        <label className="label">Nama *</label>
        <input name="name" className="input" defaultValue={d?.name} required maxLength={200} />
      </div>
      <div>
        <label className="label">Role</label>
        <select name="role" className="input" defaultValue={d?.role ?? "anggota"}>
          <option value="anggota">Anggota</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="label">{passwordRequired ? "Password *" : "Password baru"}</label>
        <input
          name="password"
          type="password"
          className="input"
          minLength={8}
          required={passwordRequired}
          autoComplete="new-password"
          placeholder={passwordRequired ? "min. 8 karakter" : "kosongkan bila tetap"}
        />
      </div>
    </>
  );
}

export default function PenggunaPage() {
  return (
    <>
      <PageHeader icon="users" title="Pengguna" subtitle="Akun yang dapat masuk ke aplikasi." />
      <Suspense fallback={<div className="card h-64 animate-pulse bg-slate-100" />}>
        <UserList />
      </Suspense>
    </>
  );
}
