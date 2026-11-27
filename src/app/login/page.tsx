import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";
import { SpectrumBackground } from "./spectrum-background";

export const metadata: Metadata = { title: "Masuk" };

async function RedirectIfLoggedIn() {
  if (await getCurrentUser()) redirect("/");
  return null;
}

export default function LoginPage() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#0a1f44] p-4">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <SpectrumBackground />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center text-white">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-blue-700 ring-1 ring-white/25">
            <Icon name="antenna" className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal Tim Kerja Montib PKP</h1>
          <p className="mt-1 text-sm text-blue-200">Masuk untuk melihat dan mengelola jadwal.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-black/40">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
