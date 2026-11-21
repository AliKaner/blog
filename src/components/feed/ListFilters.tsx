"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SORTS, toSearchString, type ListParams } from "@/lib/listParams";

const RATINGS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

/**
 * Sort, rating band and title search for the Movies / Books lists. All
 * state lives in the URL, so a filtered view is shareable and its first
 * page renders on the server; the paginated query does the rest.
 */
export function ListFilters({ params, noun }: { params: ListParams; noun: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(params.search ?? "");

  const go = (next: ListParams) =>
    startTransition(() => router.replace(`${pathname}${toSearchString(next)}`, { scroll: false }));

  // Debounced title search.
  useEffect(() => {
    const term = search.trim();
    if (term === (params.search ?? "")) return;
    const id = setTimeout(() => go({ ...params, search: term || undefined }), 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = params.sort !== "newest" || params.rating !== undefined || Boolean(params.search);

  return (
    <div className={`flex flex-col gap-4 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
        <Label>Order</Label>
        {SORTS.map((s, i) => (
          <span key={s.value} className="flex items-baseline">
            {i > 0 && (
              <span aria-hidden className="mr-3 text-accent/50">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => go({ ...params, sort: s.value })}
              aria-pressed={params.sort === s.value}
              className={`font-accent text-base italic transition-colors ${
                params.sort === s.value
                  ? "border-b-[3px] border-double border-accent text-accent"
                  : "text-ink-soft hover:text-accent"
              }`}
            >
              {s.label}
            </button>
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Label>Rating</Label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by rating">
          <Chip active={params.rating === undefined} onClick={() => go({ ...params, rating: undefined })}>
            All
          </Chip>
          {RATINGS.map((r) => (
            <Chip
              key={r}
              active={params.rating === r}
              onClick={() => go({ ...params, rating: params.rating === r ? undefined : r })}
              label={`Only ${noun} rated ${r}`}
            >
              {r}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Label>Search</Label>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${noun} by title`}
          aria-label={`Search ${noun} by title`}
          className="input max-w-xs py-1.5 text-sm"
        />
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              go({ sort: "newest" });
            }}
            className="font-mono text-xs text-accent underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="w-16 shrink-0 font-heading text-[10px] uppercase tracking-[0.18em] text-ink-soft">{children}</span>
  );
}

function Chip({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`min-w-8 border px-2 py-0.5 font-heading text-xs transition-colors ${
        active
          ? "border-accent bg-accent text-paper"
          : "border-border text-ink-soft hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
