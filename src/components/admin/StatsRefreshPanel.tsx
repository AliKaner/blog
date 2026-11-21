"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

const WHEN = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type Kind = "movies" | "books";

/** One row per collection: what the public stats currently say, and a
    button that rebuilds them from the published rows. Stats don't update
    on every edit (a bulk import would recompute them per row), so press
    this after adding or changing entries. */
function StatsRow({ kind, label }: { kind: Kind; label: string }) {
  const { token } = useAdminSession();
  const stats = useQuery(api.stats.get, { kind });
  const refresh = useMutation(api.stats.refresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await refresh({ token, kind });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="font-heading text-base text-ink">{label}</p>
        <p className="font-mono text-xs text-ink-soft">
          {stats === undefined
            ? "…"
            : stats === null
              ? "Never refreshed — the public page shows no figures yet."
              : `${stats.total.toLocaleString("en")} published · refreshed ${WHEN.format(stats.refreshedAt)}`}
        </p>
        {error && <p className="font-mono text-xs text-accent-2">{error}</p>}
      </div>
      <button type="button" onClick={onRefresh} disabled={busy || !token} className="btn px-4 py-2 text-xs disabled:opacity-60">
        {busy ? "Refreshing…" : "Refresh stats"}
      </button>
    </div>
  );
}

/** The Journey heatmap's weekly rows (every collection). They also
    rebuild after a Movies/Books refresh; this is for changes elsewhere
    (posts, places, cocktails, dev logs). */
function JourneyRow() {
  const { token } = useAdminSession();
  const status = useQuery(api.journey.status, {});
  const refresh = useMutation(api.journey.refresh);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = async () => {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await refresh({ token });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="font-heading text-base text-ink">Journey heatmap</p>
        <p className="font-mono text-xs text-ink-soft">
          {status === undefined
            ? "…"
            : status === null
              ? "Never built — the Journey page shows no heatmap yet."
              : `${status.total.toLocaleString("en")} entries in ${status.weeks} weeks · refreshed ${WHEN.format(status.refreshedAt)}`}
        </p>
        {error && <p className="font-mono text-xs text-accent-2">{error}</p>}
      </div>
      <button type="button" onClick={onRefresh} disabled={busy || !token} className="btn px-4 py-2 text-xs disabled:opacity-60">
        {busy ? "Refreshing…" : "Refresh heatmap"}
      </button>
    </div>
  );
}

export function StatsRefreshPanel() {
  return (
    <section className="panel px-5 py-3">
      <h2 className="pt-2 font-heading text-sm uppercase tracking-[0.18em] text-ink-soft">Statistics</h2>
      <div className="divide-y divide-border">
        <StatsRow kind="movies" label="Movies" />
        <StatsRow kind="books" label="Books" />
        <JourneyRow />
      </div>
    </section>
  );
}
