"use client";

import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminLoginModal() {
  const { isLoginOpen, closeLogin, login, loginError } = useAdminSession();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  if (!isLoginOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await login(password);
    setSubmitting(false);
    setPassword("");
    router.push("/admin");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4"
      onClick={closeLogin}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-xs rounded-sm border border-border bg-card p-6 shadow-lg"
      >
        <h2 className="font-heading text-lg text-ink">Admin</h2>
        <p className="mt-1 text-sm text-ink-soft">Enter the password.</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-sm border border-border bg-paper px-3 py-2 text-ink outline-none focus:border-accent"
        />
        {loginError && (
          <p className="mt-2 text-sm text-accent">{loginError}</p>
        )}
        <div className="mt-4 flex justify-end gap-3 text-sm">
          <button
            type="button"
            onClick={closeLogin}
            className="text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !password}
            className="rounded-sm bg-accent px-3 py-1.5 text-paper disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Enter"}
          </button>
        </div>
      </form>
    </div>
  );
}
