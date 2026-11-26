"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { checkLoginBlocked, clearLoginFailures, loginKeys, recordLoginFailure } from "@/lib/rate-limit";

export type LoginState = { error?: string; username?: string };

// Hash dummy agar waktu respons sama walau username tidak ada.
let dummyHash: Promise<string> | null = null;

/** IP klien. Di Vercel, x-forwarded-for diisi oleh platform (bukan dari klien). */
async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { error: "Username dan password wajib diisi.", username };
  if (username.length > 50 || password.length > 200) return { error: "Username atau password salah.", username };

  const keys = loginKeys(username, await clientIp());
  const blockedMin = await checkLoginBlocked(keys);
  if (blockedMin) {
    return { error: `Terlalu banyak percobaan login gagal. Coba lagi dalam ${blockedMin} menit.`, username };
  }

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  dummyHash ??= hashPassword("dummy-password");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) {
    await recordLoginFailure(keys);
    return { error: "Username atau password salah.", username };
  }

  await clearLoginFailures(keys);
  await createSession(user.id);
  redirect("/jadwal");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
