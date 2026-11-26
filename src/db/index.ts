import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set (lihat .env.example)");

// Satu klien per instance (di dev, simpan di globalThis agar HMR tidak membuat koneksi baru).
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };
const client =
  globalForDb.pg ??
  postgres(url, {
    // prepare:false agar kompatibel dengan connection pooler (Neon/PgBouncer).
    prepare: false,
    max: Number(process.env.DB_POOL_MAX ?? 5),
  });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
