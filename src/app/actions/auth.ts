"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";

export type LoginState = { error?: string; username?: string };

// Hash dummy agar waktu respons sama walau username tidak ada.
let dummyHash: Promise<string> | null = null;

export async function login(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { error: "Username dan password wajib diisi.", username };

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  dummyHash ??= hashPassword("dummy-password");
  const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !ok) return { error: "Username atau password salah.", username };

  await createSession(user.id);
  redirect("/jadwal");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
