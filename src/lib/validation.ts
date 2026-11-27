import { z } from "zod";
import { isMonday } from "./weeks";

const req = (label: string, max = 200) =>
  z.string({ error: `${label} wajib diisi` }).trim().min(1, `${label} wajib diisi`).max(max, `${label} terlalu panjang`);

const opt = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, "Teks terlalu panjang")
    .optional()
    .transform((v) => (v ? v : null));

export const id = z.coerce.number().int().positive("ID tidak valid");
const optId = z
  .union([z.literal(""), z.coerce.number().int().positive()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const monday = z.string().refine(isMonday, "Minggu tidak valid");

/** FormData → object biasa; field yang berulang (checkbox) jadi array. */
export function formToObject(fd: FormData, arrays: string[] = []) {
  const obj: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$")) continue; // field internal React
    obj[key] = arrays.includes(key) ? fd.getAll(key) : fd.get(key);
  }
  for (const key of arrays) obj[key] ??= [];
  return obj;
}

export const teamSchema = z.object({
  name: req("Nama tim"),
  description: opt(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const activitySchema = z.object({
  teamId: id,
  name: req("Nama kegiatan"),
  description: opt(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const officerSchema = z.object({
  name: req("Nama petugas"),
  position: opt(100),
  teamId: optId,
});

export const userCreateSchema = z.object({
  username: req("Username", 50).regex(/^[a-z0-9._-]+$/i, "Username hanya huruf, angka, titik, - dan _").toLowerCase(),
  name: req("Nama"),
  role: z.enum(["admin", "anggota"], "Role tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter").max(200),
});

export const userUpdateSchema = userCreateSchema.extend({
  id,
  password: z
    .string()
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || v.length >= 8, "Password minimal 8 karakter"),
});

export const statusSchema = z
  .object({
    status: z.enum(["belum", "selesai", "diganti", "tidak_dikerjakan"], "Status tidak valid"),
    replacementType: z
      .enum(["jadwal_ulang", "ganti_kegiatan"])
      .optional()
      .or(z.literal("").transform(() => undefined)),
    replacementWeek: z.string().optional(),
    replacementActivity: opt(200),
    replacementNote: opt(),
  })
  .superRefine((v, ctx) => {
    if (v.status !== "diganti") return;
    if (!v.replacementType) {
      ctx.addIssue({ code: "custom", message: "Pilih jenis penggantian" });
    } else if (v.replacementType === "jadwal_ulang" && !isMonday(v.replacementWeek ?? "")) {
      ctx.addIssue({ code: "custom", message: "Pilih minggu tujuan jadwal ulang" });
    } else if (v.replacementType === "ganti_kegiatan" && !v.replacementActivity) {
      ctx.addIssue({ code: "custom", message: "Isi kegiatan pengganti" });
    }
  });
export type StatusInput = z.infer<typeof statusSchema>;

export const taskSchema = z.object({
  id: optId,
  activityId: id,
  weekStart: monday,
  title: req("Judul task"),
  notes: opt(1000),
  officerIds: z.array(z.coerce.number().int().positive()).max(50),
});
