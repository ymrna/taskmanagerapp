/**
 * Seed database.
 *   npm run db:seed            → buat akun admin pertama (bila belum ada pengguna)
 *   npm run db:seed -- --demo  → + data contoh (tim, kegiatan, petugas, task)
 *
 * Membaca DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME dari environment / .env
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { count } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../src/db/schema.ts";
import { hashPassword } from "../src/lib/password.ts";
import { addDays, mondayOf, todayStr } from "../src/lib/weeks.ts";

const { users, teams, activities, officers, tasks, taskOfficers } = schema;

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set");
const client = postgres(url, { prepare: false, max: 1 });
const db = drizzle(client, { schema });

async function main() {
  const [{ n }] = await db.select({ n: count() }).from(users);
  if (n === 0) {
    const username = (process.env.ADMIN_USERNAME ?? "admin").toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 8) throw new Error("Set ADMIN_PASSWORD (min. 8 karakter) untuk membuat admin pertama");
    await db.insert(users).values({
      username,
      name: process.env.ADMIN_NAME ?? "Administrator",
      role: "admin",
      passwordHash: await hashPassword(password),
    });
    console.log(`✓ Admin "${username}" dibuat`);
  } else {
    console.log(`• Sudah ada ${n} pengguna, admin tidak dibuat ulang`);
  }

  if (!process.argv.includes("--demo")) return;
  const [{ t }] = await db.select({ t: count() }).from(teams);
  if (t > 0) return console.log("• Data tim sudah ada, data contoh dilewati");

  const [tA, tB] = await db
    .insert(teams)
    .values([
      { name: "Tim Pengawasan", sortOrder: 1 },
      { name: "Tim Pelaporan", sortOrder: 2 },
    ])
    .returning();
  const acts = await db
    .insert(activities)
    .values([
      { teamId: tA.id, name: "Monitoring lapangan", sortOrder: 1 },
      { teamId: tA.id, name: "Rapat koordinasi", sortOrder: 2 },
      { teamId: tB.id, name: "Laporan bulanan", sortOrder: 1 },
      { teamId: tB.id, name: "Rekap data", sortOrder: 2 },
    ])
    .returning();
  const offs = await db
    .insert(officers)
    .values([
      { name: "Andi Pratama", nip: "198701012010011001", position: "Ketua Tim", teamId: tA.id },
      { name: "Siti Rahma", nip: "199003152015022002", position: "Analis", teamId: tA.id },
      { name: "Budi Santoso", position: "Staf", teamId: tB.id },
      { name: "Dewi Lestari", position: "Pranata Komputer", teamId: tB.id },
    ])
    .returning();

  const week0 = mondayOf(todayStr());
  const plan: [number, number, string, (typeof schema.taskStatusEnum.enumValues)[number], number[]][] = [
    [0, -14, "Kunjungan lokasi A", "selesai", [0, 1]],
    [0, -7, "Kunjungan lokasi B", "tidak_dikerjakan", [1]],
    [0, 0, "Kunjungan lokasi C", "belum", [0]],
    [1, -7, "Rakor mingguan", "selesai", [0, 1]],
    [1, 7, "Rakor evaluasi", "belum", [0]],
    [2, 0, "Susun laporan", "belum", [2, 3]],
    [3, -14, "Rekap data Q3", "selesai", [3]],
  ];
  for (const [a, days, title, status, o] of plan) {
    const [row] = await db
      .insert(tasks)
      .values({ activityId: acts[a].id, weekStart: addDays(week0, days), title, status })
      .returning();
    await db.insert(taskOfficers).values(o.map((i) => ({ taskId: row.id, officerId: offs[i].id })));
  }
  console.log("✓ Data contoh dibuat");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => client.end());
