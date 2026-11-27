import type { ReplacementType, TaskStatus } from "@/db/schema";

export const STATUS: Record<TaskStatus, { label: string; chip: string; dot: string; symbol: string }> = {
  belum: { label: "Belum", chip: "bg-slate-100 text-slate-800 border-slate-300", dot: "bg-slate-400", symbol: "○" },
  selesai: { label: "Selesai", chip: "bg-emerald-50 text-emerald-900 border-emerald-300", dot: "bg-emerald-500", symbol: "✓" },
  diganti: { label: "Diganti", chip: "bg-amber-50 text-amber-900 border-amber-300", dot: "bg-amber-500", symbol: "↻" },
  tidak_dikerjakan: { label: "Tidak dikerjakan", chip: "bg-rose-50 text-rose-900 border-rose-300 line-through decoration-rose-400", dot: "bg-rose-500", symbol: "✕" },
};

export const STATUS_KEYS = Object.keys(STATUS) as TaskStatus[];

/**
 * Warna status untuk chart (divalidasi dengan validator palet dataviz).
 * Urutan tumpukan memisahkan hijau & merah agar pasangan bersebelahan tetap
 * terbedakan oleh pembaca buta warna; status selalu disertai simbol + label.
 */
export const STATUS_COLOR: Record<TaskStatus, string> = {
  selesai: "#0aac23",
  diganti: "#fbb315",
  tidak_dikerjakan: "#dc3c3d",
  belum: "#64748b",
};
export const STACK_ORDER: TaskStatus[] = ["selesai", "diganti", "tidak_dikerjakan", "belum"];

export const REPLACEMENT: Record<ReplacementType, string> = {
  jadwal_ulang: "Dijadwal ulang",
  ganti_kegiatan: "Ganti kegiatan",
};

export const ROLE_LABEL = { admin: "Admin", anggota: "Anggota" } as const;
