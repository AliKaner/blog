"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { OrbRating } from "@/components/components/library/OrbRating";
import { OrbSearch } from "@/components/components/library/OrbSearch";
import { SORTS, toSearchString, type ListParams } from "@/lib/listParams";

// The site palette, handed to the orbs' own theme variables.
const ORB_THEME = {
  accent: "var(--accent)",
  ink: "var(--ink)",
  muted: "var(--ink-soft)",
  surface: "var(--card)",
};

/**
 * Sort, rating and title search for the Movies / Books walls. All state
 * lives in the URL, so a filtered view is shareable and its first page
 * renders on the server; the paginated query does the rest. Rating and
 * search are the same copyable orbs shown on /components.
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

  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-3 transition-opacity ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
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

      <span aria-hidden className="hidden text-accent/60 sm:inline">
        ❧
      </span>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
        <OrbRating
          value={params.rating ?? null}
          onChange={(rating) => go({ ...params, rating: rating ?? undefined })}
          label={`Filter ${noun} by rating`}
          theme={ORB_THEME}
          className="font-heading"
        />
        <OrbSearch
          value={search}
          onChange={setSearch}
          label={`Search ${noun} by title`}
          placeholder={`Search ${noun}…`}
          defaultOpen={Boolean(params.search)}
          theme={ORB_THEME}
          className="font-accent"
        />
      </div>
    </div>
  );
}
