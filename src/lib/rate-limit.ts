import "server-only";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

/**
 * Rate limit login berbasis DB (aman untuk serverless multi-instance).
 * Jendela tetap 15 menit; hanya percobaan GAGAL yang dihitung.
 *  - per username+IP: 5 gagal   → mencegah tebak password satu akun
 *  - per IP:          20 gagal  → mencegah mencoba banyak username
 * Kunci username digabung dengan IP agar penyerang tidak bisa mengunci akun orang lain.
 */
export const WINDOW_MINUTES = 15;
const LIMITS = { user: 5, ip: 20 } as const;

export function loginKeys(username: string, ip: string) {
  return { user: `user:${username}|${ip}`, ip: `ip:${ip}` };
}

/** Sisa menit blokir bila sudah melewati batas, atau null bila boleh mencoba. */
export async function checkLoginBlocked(keys: { user: string; ip: string }): Promise<number | null> {
  const rows = await db
    .select({
      key: loginAttempts.key,
      count: loginAttempts.count,
      remainingSec: sql<number>`extract(epoch from (${loginAttempts.windowStart} + make_interval(mins => ${WINDOW_MINUTES}) - now()))`,
    })
    .from(loginAttempts)
    .where(inArray(loginAttempts.key, [keys.user, keys.ip]));

  let remaining = 0;
  for (const r of rows) {
    const limit = r.key === keys.user ? LIMITS.user : LIMITS.ip;
    const sec = Number(r.remainingSec);
    if (sec > 0 && r.count >= limit) remaining = Math.max(remaining, sec);
  }
  return remaining > 0 ? Math.ceil(remaining / 60) : null;
}

/** Catat satu kegagalan (atomik; jendela di-reset bila sudah kedaluwarsa). */
export async function recordLoginFailure(keys: { user: string; ip: string }) {
  const expired = sql`${loginAttempts.windowStart} < now() - make_interval(mins => ${WINDOW_MINUTES})`;
  await db
    .insert(loginAttempts)
    .values([
      { key: keys.user, count: 1 },
      { key: keys.ip, count: 1 },
    ])
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        count: sql`case when ${expired} then 1 else ${loginAttempts.count} + 1 end`,
        windowStart: sql`case when ${expired} then now() else ${loginAttempts.windowStart} end`,
      },
    });
  // Bersihkan entri lama sesekali agar tabel tidak tumbuh tanpa batas.
  if (Math.random() < 0.05) {
    await db.delete(loginAttempts).where(sql`${loginAttempts.windowStart} < now() - interval '1 day'`);
  }
}

/** Login berhasil: reset penghitung username+IP (penghitung IP dibiarkan). */
export async function clearLoginFailures(keys: { user: string }) {
  await db.delete(loginAttempts).where(inArray(loginAttempts.key, [keys.user]));
}
