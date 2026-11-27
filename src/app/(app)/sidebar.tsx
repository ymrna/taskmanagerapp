"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Icon, type IconName } from "@/components/icons";
import type { Role } from "@/db/schema";
import { ROLE_LABEL } from "@/lib/labels";

type Item = { href: string; label: string; icon: IconName; adminOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/jadwal", label: "Jadwal", icon: "calendar" },
  { href: "/tim", label: "Tim & Kegiatan", icon: "layers", adminOnly: true },
  { href: "/petugas", label: "Petugas", icon: "badge", adminOnly: true },
  { href: "/pengguna", label: "Pengguna", icon: "users", adminOnly: true },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

export function Sidebar({ user }: { user: { name: string; role: Role } }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const items = ITEMS.filter((i) => !i.adminOnly || user.role === "admin");
  const current = items.find((i) => isActive(path, i.href));

  const panel = (
    <div className="flex h-full flex-col bg-blue-800 text-blue-50">
      <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 pt-6 pb-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
          <Icon name="antenna" className="h-5 w-5 text-white" />
        </span>
        <span className="leading-tight">
          <span className="block text-base font-bold tracking-wide text-white">Montib PKP</span>
          <span className="block text-xs text-blue-200">Jadwal Tim Kerja</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-3" aria-label="Menu utama">
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-blue-300/80 uppercase">Menu</p>
        {items.map((i) => {
          const active = isActive(path, i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                active ? "bg-white text-blue-800 shadow-md shadow-blue-950/30" : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon name={i.icon} className={`h-5 w-5 ${active ? "text-blue-600" : "text-blue-300 group-hover:text-white"}`} />
              <span className="font-medium">{i.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-sky-300 text-sm font-bold text-blue-950">
            {initials(user.name)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-blue-200">{ROLE_LABEL[user.role]}</p>
          </div>
          <form action={logout}>
            <button
              className="grid h-8 w-8 place-items-center rounded-lg text-blue-200 hover:bg-white/15 hover:text-white"
              aria-label="Keluar"
              title="Keluar"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">{panel}</aside>

      {/* Mobile: bar atas + drawer */}
      <div className="no-print sticky top-0 z-40 flex items-center gap-3 bg-blue-800 px-3 py-2.5 text-white shadow-md lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-lg hover:bg-white/15"
          aria-label="Buka menu"
          aria-expanded={open}
        >
          <Icon name="menu" />
        </button>
        <span className="font-semibold">{current?.label ?? "Montib PKP"}</span>
        <span className="ml-auto text-xs text-blue-200">Montib PKP</span>
      </div>
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-slate-950/50" onClick={() => setOpen(false)} aria-label="Tutup menu" />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-5 right-3 z-10 grid h-8 w-8 place-items-center rounded-lg text-blue-100 hover:bg-white/15"
              aria-label="Tutup menu"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
            {panel}
          </div>
        </div>
      )}
    </>
  );
}

export function SidebarSkeleton() {
  return (
    <>
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-64 bg-blue-800 lg:block" />
      <div className="no-print sticky top-0 z-40 h-14 bg-blue-800 lg:hidden" />
    </>
  );
}
