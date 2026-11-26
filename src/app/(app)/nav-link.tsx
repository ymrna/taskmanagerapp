"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-md px-2 py-1 ${active ? "bg-sky-50 font-medium text-sky-800" : "text-slate-600 hover:bg-slate-100"}`}
    >
      {children}
    </Link>
  );
}
