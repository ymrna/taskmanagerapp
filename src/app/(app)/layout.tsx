import { Suspense } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { NavLink } from "./nav-link";

async function UserNav() {
  const user = await requireUser();
  const links = [
    { href: "/jadwal", label: "Jadwal" },
    ...(user.role === "admin"
      ? [
          { href: "/tim", label: "Tim & Kegiatan" },
          { href: "/petugas", label: "Petugas" },
          { href: "/pengguna", label: "Pengguna" },
        ]
      : []),
  ];
  return (
    <>
      <nav className="-mx-1 flex gap-1 overflow-x-auto text-sm">
        {links.map((l) => (
          <NavLink key={l.href} href={l.href}>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3 text-sm">
        <span className="hidden text-slate-600 sm:inline">
          {user.name} <span className="text-slate-400">· {ROLE_LABEL[user.role]}</span>
        </span>
        <form action={logout}>
          <button className="btn-secondary px-2 py-1 text-xs">Keluar</button>
        </form>
      </div>
    </>
  );
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2 sm:px-4">
          <Link href="/jadwal" className="font-semibold text-sky-800">
            Jadwal Tim Kerja Montib PKP
          </Link>
          <Suspense fallback={<div className="h-7 flex-1" />}>
            <UserNav />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-4">{children}</main>
    </>
  );
}
