"use client";

import { useEffect } from "react";

export function PrintButton() {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="no-print flex items-center gap-2">
      <span className="text-xs text-slate-500">Pilih &quot;Simpan sebagai PDF&quot; di dialog cetak.</span>
      <button className="btn-primary" onClick={() => window.print()}>
        Cetak / Simpan PDF
      </button>
    </div>
  );
}
