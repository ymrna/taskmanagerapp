"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import type { ActionResult } from "@/lib/action";

type Props = {
  action: (fd: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  /** Kosongkan form setelah berhasil (untuk form tambah). */
  resetOnSuccess?: boolean;
  /** Tampilkan dialog konfirmasi sebelum submit. */
  confirm?: string;
  onSuccess?: (r: ActionResult) => void;
  /** Sembunyikan pesan sukses (mis. form yang langsung tertutup). */
  quiet?: boolean;
  /** id form, agar input di luar form (atribut `form`) ikut terkirim. */
  id?: string;
};

/**
 * Form yang memanggil server action tanpa me-reset input saat gagal validasi,
 * menonaktifkan input selama proses, dan menampilkan pesan hasil.
 */
export function ActionForm({ action, children, className, resetOnSuccess, confirm, onSuccess, quiet, id }: Props) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      id={id}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          setResult(r);
          if (r.ok) {
            if (resetOnSuccess) ref.current?.reset();
            onSuccess?.(r);
          }
        });
      }}
    >
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {result && (!result.ok || !quiet) && (
        <p
          role={result.ok ? "status" : "alert"}
          className={`basis-full text-sm ${result.ok ? "text-emerald-700" : "text-rose-700"}`}
        >
          {result.ok ? result.message : result.error}
        </p>
      )}
    </form>
  );
}
