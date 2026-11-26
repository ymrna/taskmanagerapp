"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { activities, officers, sessions, teams, users } from "@/db/schema";
import { assertAdmin } from "@/lib/auth";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { hashPassword } from "@/lib/password";
import {
  activitySchema,
  formToObject,
  id,
  officerSchema,
  teamSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@/lib/validation";

const getId = (fd: FormData) => id.parse(fd.get("id"));

function refresh(...paths: string[]) {
  for (const p of [...paths, "/jadwal"]) revalidatePath(p);
}

// ---------- Tim ----------
export async function saveTeam(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const data = teamSchema.parse(formToObject(fd));
    const editId = fd.get("id") ? getId(fd) : null;
    if (editId) await db.update(teams).set(data).where(eq(teams.id, editId));
    else await db.insert(teams).values(data);
    refresh("/tim");
    return editId ? "Tim diperbarui." : "Tim ditambahkan.";
  });
}

export async function deleteTeam(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    await db.delete(teams).where(eq(teams.id, getId(fd)));
    refresh("/tim", "/petugas");
    return "Tim dihapus.";
  });
}

// ---------- Kegiatan ----------
export async function saveActivity(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const data = activitySchema.parse(formToObject(fd));
    const editId = fd.get("id") ? getId(fd) : null;
    if (editId) await db.update(activities).set(data).where(eq(activities.id, editId));
    else await db.insert(activities).values(data);
    refresh("/tim");
    return editId ? "Kegiatan diperbarui." : "Kegiatan ditambahkan.";
  });
}

export async function deleteActivity(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    await db.delete(activities).where(eq(activities.id, getId(fd)));
    refresh("/tim");
    return "Kegiatan dihapus.";
  });
}

// ---------- Petugas ----------
export async function saveOfficer(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const data = officerSchema.parse(formToObject(fd));
    const editId = fd.get("id") ? getId(fd) : null;
    if (editId) await db.update(officers).set(data).where(eq(officers.id, editId));
    else await db.insert(officers).values(data);
    refresh("/petugas");
    return editId ? "Petugas diperbarui." : "Petugas ditambahkan.";
  });
}

export async function deleteOfficer(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    await db.delete(officers).where(eq(officers.id, getId(fd)));
    refresh("/petugas");
    return "Petugas dihapus.";
  });
}

// ---------- Pengguna ----------
async function adminCountExcept(userId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(users)
    .where(and(eq(users.role, "admin"), ne(users.id, userId)));
  return row.n;
}

export async function createUser(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const data = userCreateSchema.parse(formToObject(fd));
    await db.insert(users).values({
      username: data.username,
      name: data.name,
      role: data.role,
      passwordHash: await hashPassword(data.password),
    });
    revalidatePath("/pengguna");
    return "Pengguna ditambahkan.";
  });
}

export async function updateUser(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const me = await assertAdmin();
    const data = userUpdateSchema.parse(formToObject(fd));
    if (data.role !== "admin" && (await adminCountExcept(data.id)) === 0) {
      throw new UserError("Harus ada minimal satu admin.");
    }
    if (data.id === me.id && data.role !== "admin") {
      throw new UserError("Anda tidak dapat menurunkan role akun sendiri.");
    }
    await db
      .update(users)
      .set({
        username: data.username,
        name: data.name,
        role: data.role,
        ...(data.password ? { passwordHash: await hashPassword(data.password) } : {}),
      })
      .where(eq(users.id, data.id));
    // Reset password / ganti role → paksa login ulang di perangkat lain.
    if (data.password && data.id !== me.id) await db.delete(sessions).where(eq(sessions.userId, data.id));
    revalidatePath("/pengguna");
    return "Pengguna diperbarui.";
  });
}

export async function deleteUser(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const me = await assertAdmin();
    const userId = getId(fd);
    if (userId === me.id) throw new UserError("Anda tidak dapat menghapus akun sendiri.");
    if ((await adminCountExcept(userId)) === 0) throw new UserError("Harus ada minimal satu admin.");
    await db.delete(users).where(eq(users.id, userId));
    revalidatePath("/pengguna");
    return "Pengguna dihapus.";
  });
}
