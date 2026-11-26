import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { AuthError } from "./auth";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/** Galat yang pesannya aman ditampilkan ke pengguna. */
export class UserError extends Error {}

/** Bungkus server action: ubah galat yang dikenal menjadi pesan untuk UI. */
export async function runAction(fn: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await fn();
    return { ok: true, message: message ?? undefined };
  } catch (err) {
    unstable_rethrow(err);
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.issues.map((i) => i.message).join("; ") };
    }
    if (err instanceof AuthError || err instanceof UserError) {
      return { ok: false, error: err.message };
    }
    const cause = (err as { cause?: { code?: string } })?.cause ?? err;
    if ((cause as { code?: string })?.code === "23505") {
      return { ok: false, error: "Data sudah ada (duplikat)." };
    }
    console.error(err);
    return { ok: false, error: "Terjadi kesalahan pada server." };
  }
}
