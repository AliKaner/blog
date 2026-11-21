"use client";

import { useEffect, useState } from "react";

export type AdminStatus = "all" | "published" | "draft";

const STATUSES: { value: AdminStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Drafts" },
];

/** Search box (debounced) + status filter for the paginated admin lists. */
export function AdminListControls({
  noun,
  status,
  onStatus,
  onSearch,
}: {
  noun: string;
  status: AdminStatus;
  onStatus: (s: AdminStatus) => void;
  onSearch: (term: string) => void;
}) {
  const [term, setTerm] = useState("");
  useEffect(() => {
    const id = setTimeout(() => onSearch(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term, onSearch]);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={`Search ${noun} by title`}
        aria-label={`Search ${noun} by title`}
        className="input max-w-xs py-1.5 text-sm"
      />
      <div className="flex gap-1" role="group" aria-label="Filter by status">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onStatus(s.value)}
            aria-pressed={status === s.value}
            className={`border px-2.5 py-1 font-mono text-xs transition-colors ${
              status === s.value
                ? "border-accent bg-accent text-paper"
                : "border-border text-ink-soft hover:border-accent hover:text-accent"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** "Load more" footer for a paginated admin list. */
export function AdminLoadMore({
  status,
  count,
  onMore,
}: {
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  count: number;
  onMore: () => void;
}) {
  return (
    <div className="mt-4 flex items-center gap-3 font-mono text-xs text-ink-soft">
      <span>{count.toLocaleString("en")} shown</span>
      {status === "CanLoadMore" && (
        <button type="button" onClick={onMore} className="btn btn-plain px-3 py-1 text-xs">
          Load more
        </button>
      )}
      {status === "LoadingMore" && <span>Loading…</span>}
    </div>
  );
}
