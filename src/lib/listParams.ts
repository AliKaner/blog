/** URL state for the Movies / Books lists: ?sort=…&rating=…&q=… */

export type ListSort = "newest" | "oldest" | "rating-desc" | "rating-asc";

export type ListParams = {
  sort: ListSort;
  rating?: number;
  search?: string;
};

export const SORTS: { value: ListSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "rating-desc", label: "Highest rated" },
  { value: "rating-asc", label: "Lowest rated" },
];

const isSort = (s: string | undefined): s is ListSort => SORTS.some((o) => o.value === s);

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Read (and sanitise) list params from a page's searchParams. */
export function parseListParams(raw: Raw): ListParams {
  const sort = first(raw.sort);
  const ratingRaw = first(raw.rating);
  const rating = ratingRaw !== undefined && /^\d{1,2}$/.test(ratingRaw) ? Number(ratingRaw) : undefined;
  const search = first(raw.q)?.trim().slice(0, 80);
  return {
    sort: isSort(sort) ? sort : "newest",
    rating: rating !== undefined && rating >= 0 && rating <= 10 ? rating : undefined,
    search: search || undefined,
  };
}

/** The query args for movies.page / books.page (pagination added by caller). */
export function toQueryArgs(p: ListParams) {
  return {
    ...(p.sort !== "newest" ? { sort: p.sort } : {}),
    ...(p.rating !== undefined ? { rating: p.rating } : {}),
    ...(p.search ? { search: p.search } : {}),
  };
}

/** "?sort=oldest&rating=8" — empty string for the defaults. */
export function toSearchString(p: ListParams): string {
  const s = new URLSearchParams();
  if (p.sort !== "newest") s.set("sort", p.sort);
  if (p.rating !== undefined) s.set("rating", String(p.rating));
  if (p.search) s.set("q", p.search);
  const str = s.toString();
  return str ? `?${str}` : "";
}

/** How many rows the current view has in total, from the stored stats —
    or null when that can't be known without counting (search). */
export function knownTotal(
  p: ListParams,
  stats: { total: number; rated: number; ratingHistogram: number[] } | null,
): number | null {
  if (!stats || p.search) return null;
  if (p.rating !== undefined) return stats.ratingHistogram[p.rating] ?? 0;
  if (p.sort === "rating-desc" || p.sort === "rating-asc") return stats.rated;
  return stats.total;
}
