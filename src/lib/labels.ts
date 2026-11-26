import type { ReplacementType, TaskStatus } from "@/db/schema";

export const STATUS: Record<TaskStatus, { label: string; chip: string; dot: string; symbol: string }> = {
  belum: { label: "Belum", chip: "bg-slate-100 text-slate-800 border-slate-300", dot: "bg-slate-400", symbol: "○" },
  selesai: { label: "Selesai", chip: "bg-emerald-50 text-emerald-900 border-emerald-300", dot: "bg-emerald-500", symbol: "✓" },
  diganti: { label: "Diganti", chip: "bg-amber-50 text-amber-900 border-amber-300", dot: "bg-amber-500", symbol: "↻" },
  tidak_dikerjakan: { label: "Tidak dikerjakan", chip: "bg-rose-50 text-rose-900 border-rose-300 line-through decoration-rose-400", dot: "bg-rose-500", symbol: "✕" },
};

export const STATUS_KEYS = Object.keys(STATUS) as TaskStatus[];

export const REPLACEMENT: Record<ReplacementType, string> = {
  jadwal_ulang: "Dijadwal ulang",
  ganti_kegiatan: "Ganti kegiatan",
};

export const ROLE_LABEL = { admin: "Admin", anggota: "Anggota" } as const;
