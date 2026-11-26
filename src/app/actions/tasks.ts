"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, type Tx } from "@/db";
import { activities, officers, taskOfficers, tasks } from "@/db/schema";
import { assertAdmin, assertUser } from "@/lib/auth";
import { runAction, UserError, type ActionResult } from "@/lib/action";
import { formToObject, id, statusSchema, taskSchema, type StatusInput } from "@/lib/validation";

function revalidate() {
  revalidatePath("/jadwal");
}

async function setOfficers(tx: Tx, taskId: number, officerIds: number[]) {
  await tx.delete(taskOfficers).where(eq(taskOfficers.taskId, taskId));
  const unique = [...new Set(officerIds)];
  if (!unique.length) return;
  const existing = await tx.select({ id: officers.id }).from(officers).where(inArray(officers.id, unique));
  if (existing.length !== unique.length) throw new UserError("Ada petugas yang tidak ditemukan.");
  await tx.insert(taskOfficers).values(unique.map((officerId) => ({ taskId, officerId })));
}

/**
 * Terapkan status ke task. Untuk "diganti → dijadwal ulang", buat (atau pindahkan)
 * task pengganti di minggu tujuan, terhubung lewat rescheduledFromId.
 */
async function applyStatus(tx: Tx, taskId: number, input: StatusInput) {
  const [task] = await tx.select().from(tasks).where(eq(tasks.id, taskId)).for("update");
  if (!task) throw new UserError("Task tidak ditemukan.");

  const isResched = input.status === "diganti" && input.replacementType === "jadwal_ulang";
  const isSwap = input.status === "diganti" && input.replacementType === "ganti_kegiatan";

  if (isResched && input.replacementWeek === task.weekStart) {
    throw new UserError("Minggu tujuan harus berbeda dari minggu task.");
  }

  await tx
    .update(tasks)
    .set({
      status: input.status,
      replacementType: input.status === "diganti" ? input.replacementType : null,
      replacementWeek: isResched ? input.replacementWeek! : null,
      replacementActivity: isSwap ? input.replacementActivity : null,
      replacementNote: input.status === "diganti" ? input.replacementNote : null,
      updatedAt: sql`now()`,
    })
    .where(eq(tasks.id, taskId));

  if (!isResched) return;

  const [child] = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.rescheduledFromId, taskId))
    .limit(1);
  if (child) {
    await tx
      .update(tasks)
      .set({ weekStart: input.replacementWeek!, updatedAt: sql`now()` })
      .where(eq(tasks.id, child.id));
    return;
  }
  const [created] = await tx
    .insert(tasks)
    .values({
      activityId: task.activityId,
      weekStart: input.replacementWeek!,
      title: task.title,
      notes: task.notes,
      rescheduledFromId: task.id,
    })
    .returning({ id: tasks.id });
  const assigned = await tx.select().from(taskOfficers).where(eq(taskOfficers.taskId, task.id));
  if (assigned.length) {
    await tx.insert(taskOfficers).values(assigned.map((a) => ({ taskId: created.id, officerId: a.officerId })));
  }
}

/** Admin: buat atau ubah task lengkap (isi, petugas, status). */
export async function saveTask(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const raw = formToObject(fd, ["officerIds"]);
    const data = taskSchema.parse(raw);
    const status = statusSchema.parse(raw);

    const [act] = await db.select({ id: activities.id }).from(activities).where(eq(activities.id, data.activityId));
    if (!act) throw new UserError("Kegiatan tidak ditemukan.");

    await db.transaction(async (tx) => {
      let taskId = data.id;
      if (taskId) {
        const updated = await tx
          .update(tasks)
          .set({ title: data.title, notes: data.notes, updatedAt: sql`now()` })
          .where(and(eq(tasks.id, taskId), eq(tasks.activityId, data.activityId)))
          .returning({ id: tasks.id });
        if (!updated.length) throw new UserError("Task tidak ditemukan.");
      } else {
        const [row] = await tx
          .insert(tasks)
          .values({ activityId: data.activityId, weekStart: data.weekStart, title: data.title, notes: data.notes })
          .returning({ id: tasks.id });
        taskId = row.id;
      }
      await setOfficers(tx, taskId, data.officerIds);
      await applyStatus(tx, taskId, status);
    });
    revalidate();
    return data.id ? "Task diperbarui." : "Task ditambahkan.";
  });
}

/** Admin & anggota: ubah status saja. */
export async function updateTaskStatus(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertUser();
    const raw = formToObject(fd);
    const taskId = id.parse(raw.id);
    const status = statusSchema.parse(raw);
    await db.transaction((tx) => applyStatus(tx, taskId, status));
    revalidate();
    return "Status diperbarui.";
  });
}

export async function deleteTask(fd: FormData): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const taskId = id.parse(fd.get("id"));
    await db.delete(tasks).where(eq(tasks.id, taskId));
    revalidate();
    return "Task dihapus.";
  });
}
