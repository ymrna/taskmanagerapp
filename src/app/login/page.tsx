import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

async function RedirectIfLoggedIn() {
  if (await getCurrentUser()) redirect("/jadwal");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Suspense>
        <RedirectIfLoggedIn />
      </Suspense>
      <div className="card w-full max-w-sm p-6">
        <h1 className="text-lg font-semibold">Jadwal Tim Kerja Montib PKP</h1>
        <p className="mb-6 text-sm text-slate-500">Masuk untuk melihat dan mengelola jadwal.</p>
        <LoginForm />
      </div>
    </main>
  );
}
