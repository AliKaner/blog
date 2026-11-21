"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

/** "Publish all" / "Unpublish all" for a whole collection. The work runs
    as a background job in batches (and refreshes the stats at the end),
    so the list below updates as it goes. */
export function PublishAllButtons({ kind }: { kind: "movies" | "books" }) {
  const { token } = useAdminSession();
  const publishMovies = useMutation(api.movies.setAllPublished);
  const publishBooks = useMutation(api.books.setAllPublished);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (value: boolean) => {
    if (!token) return;
    if (!value && !window.confirm(`Unpublish all ${kind}? They'll disappear from the public site.`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fn = kind === "movies" ? publishMovies : publishBooks;
      await fn({ token, published: value });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start that");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => run(true)}
        disabled={busy}
        className="btn btn-plain px-3 py-1.5 text-xs disabled:opacity-50"
      >
        Publish all
      </button>
      <button
        type="button"
        onClick={() => run(false)}
        disabled={busy}
        className="font-mono text-xs text-ink-soft underline-offset-2 hover:text-accent hover:underline disabled:opacity-50"
      >
        Unpublish all
      </button>
      {error && <span className="font-mono text-xs text-accent-2">{error}</span>}
    </div>
  );
}
