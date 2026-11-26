"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          className="input"
          autoComplete="username"
          autoCapitalize="none"
          defaultValue={state.username}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-rose-700">{state.error}</p>
      )}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
