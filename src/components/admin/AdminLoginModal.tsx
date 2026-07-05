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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"
      onClick={closeLogin}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="panel w-full max-w-xs p-6"
      >
        <h2 className="font-heading text-lg text-ink">Admin</h2>
        <p className="mt-1 text-sm text-ink-soft">Enter the password.</p>
        <input
          autoFocus
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mt-4"
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
            className="btn px-3 py-1.5 disabled:opacity-50"
          >
            {submitting ? "Checking…" : "Enter"}
          </button>
        </div>
      </form>
    </div>
  );
}
