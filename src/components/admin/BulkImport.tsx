"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

const BATCH = 100;

type Kind = "movies" | "books";

type MovieRow = {
  title: string;
  slug?: string;
  year?: number;
  rating?: number;
  review?: string;
  watchedAt: number;
  published?: boolean;
};

type BookRow = {
  title: string;
  slug?: string;
  author?: string;
  rating?: number;
  review?: string;
  finishedAt: number;
  published?: boolean;
};

type Parsed<T> = { rows: T[]; errors: { index: number; message: string }[] };

const EXAMPLES: Record<Kind, string> = {
  movies: `[
  {
    "title": "Stalker",
    "year": 1979,
    "rating": 9,
    "watchedAt": "2024-03-15",
    "review": "optional",
    "published": true
  }
]`,
  books: `[
  {
    "title": "Invisible Cities",
    "author": "Italo Calvino",
    "rating": 9,
    "finishedAt": "2024-03-15",
    "review": "optional",
    "published": true
  }
]`,
};

/** Accepts "2024-03-15", any ISO date string, or epoch milliseconds. */
function toTimestamp(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const t = Date.parse(value.trim());
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

const optionalString = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const optionalNumber = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v)
    ? v
    : typeof v === "string" && v.trim() && Number.isFinite(Number(v))
      ? Number(v)
      : undefined;

function rowsOf(data: unknown, kind: Kind): unknown[] | null {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[kind])) {
    return (data as Record<string, unknown[]>)[kind] ?? null;
  }
  return null;
}

function parseMovies(raw: unknown[]): Parsed<MovieRow> {
  const out: Parsed<MovieRow> = { rows: [], errors: [] };
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return out.errors.push({ index, message: "not an object" });
    const r = item as Record<string, unknown>;
    const title = optionalString(r.title);
    const watchedAt = toTimestamp(r.watchedAt ?? r.date);
    const rating = optionalNumber(r.rating);
    if (!title) return out.errors.push({ index, message: "missing title" });
    if (watchedAt === null) return out.errors.push({ index, message: `${title}: missing or invalid watchedAt` });
    if (rating !== undefined && (rating < 0 || rating > 10)) {
      return out.errors.push({ index, message: `${title}: rating must be 0–10` });
    }
    out.rows.push({
      title,
      slug: optionalString(r.slug),
      year: optionalNumber(r.year),
      rating,
      review: optionalString(r.review),
      watchedAt,
      published: typeof r.published === "boolean" ? r.published : undefined,
    });
  });
  return out;
}

function parseBooks(raw: unknown[]): Parsed<BookRow> {
  const out: Parsed<BookRow> = { rows: [], errors: [] };
  raw.forEach((item, index) => {
    if (!item || typeof item !== "object") return out.errors.push({ index, message: "not an object" });
    const r = item as Record<string, unknown>;
    const title = optionalString(r.title);
    const finishedAt = toTimestamp(r.finishedAt ?? r.date);
    const rating = optionalNumber(r.rating);
    if (!title) return out.errors.push({ index, message: "missing title" });
    if (finishedAt === null) return out.errors.push({ index, message: `${title}: missing or invalid finishedAt` });
    if (rating !== undefined && (rating < 0 || rating > 10)) {
      return out.errors.push({ index, message: `${title}: rating must be 0–10` });
    }
    out.rows.push({
      title,
      slug: optionalString(r.slug),
      author: optionalString(r.author),
      rating,
      review: optionalString(r.review),
      finishedAt,
      published: typeof r.published === "boolean" ? r.published : undefined,
    });
  });
  return out;
}

/**
 * Bulk import from one JSON file. Validates every row in the browser first
 * (shows what's ready and what's wrong), then sends the good rows in
 * batches of BATCH and refreshes the public stats once at the end.
 */
export function BulkImport({ kind }: { kind: Kind }) {
  const { token } = useAdminSession();
  const importMovies = useMutation(api.movies.importBatch);
  const importBooks = useMutation(api.books.importBatch);
  const refreshStats = useMutation(api.stats.refresh);

  const [parsed, setParsed] = useState<Parsed<MovieRow> | Parsed<BookRow> | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ inserted: number; skipped: { title: string; reason: string }[] } | null>(
    null,
  );
  const [runError, setRunError] = useState<string | null>(null);

  const noun = kind === "movies" ? "movies" : "books";

  const onFile = async (file: File | undefined) => {
    setParsed(null);
    setFileError(null);
    setResult(null);
    setRunError(null);
    if (!file) return;
    try {
      const data: unknown = JSON.parse(await file.text());
      const raw = rowsOf(data, kind);
      if (!raw) throw new Error(`Expected a JSON array, or { "${kind}": [...] }`);
      setParsed(kind === "movies" ? parseMovies(raw) : parseBooks(raw));
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Couldn't read that file");
    }
  };

  const run = async () => {
    if (!token || !parsed || parsed.rows.length === 0) return;
    setRunError(null);
    const total = parsed.rows.length;
    let inserted = 0;
    const skipped: { title: string; reason: string }[] = [];
    setProgress({ done: 0, total });
    try {
      for (let i = 0; i < total; i += BATCH) {
        const res =
          kind === "movies"
            ? await importMovies({ token, items: (parsed.rows as MovieRow[]).slice(i, i + BATCH) })
            : await importBooks({ token, items: (parsed.rows as BookRow[]).slice(i, i + BATCH) });
        inserted += res.inserted;
        skipped.push(...res.skipped);
        setProgress({ done: Math.min(total, i + BATCH), total });
      }
      await refreshStats({ token, kind });
      setResult({ inserted, skipped });
      setParsed(null);
    } catch (e) {
      setRunError(
        `${e instanceof Error ? e.message : "Import failed"} — ${inserted} ${noun} were added before it stopped; running the same file again skips those.`,
      );
    } finally {
      setProgress(null);
    }
  };

  return (
    <details className="panel-sm mt-6 px-4 py-3">
      <summary className="cursor-pointer font-heading text-sm uppercase tracking-[0.14em] text-ink">
        Import {noun} from JSON
      </summary>

      <div className="mt-4 flex flex-col gap-4 text-sm">
        <p className="text-ink-soft">
          One file, a JSON array (or <code>{`{ "${kind}": [...] }`}</code>). Rows whose slug already exists are
          skipped, so importing the same file twice is safe. Stats refresh once when it&apos;s done.
        </p>
        <details>
          <summary className="cursor-pointer font-mono text-xs text-accent">Example</summary>
          <pre className="mt-2 overflow-x-auto bg-paper p-3 font-mono text-xs text-ink">{EXAMPLES[kind]}</pre>
          <p className="mt-1 font-mono text-[11px] text-ink-soft">
            Required: title, {kind === "movies" ? "watchedAt" : "finishedAt"} (or &quot;date&quot;). Dates: 2024-03-15,
            ISO, or epoch ms. Rating 0–10. published defaults to true. slug is generated if missing.
          </p>
        </details>

        <input
          type="file"
          accept="application/json,.json"
          onChange={(e) => onFile(e.target.files?.[0])}
          disabled={progress !== null}
          className="input"
        />
        {fileError && <p className="font-mono text-xs text-accent-2">{fileError}</p>}

        {parsed && (
          <div className="flex flex-col gap-2">
            <p className="text-ink">
              <strong>{parsed.rows.length.toLocaleString("en")}</strong> ready to import
              {parsed.errors.length > 0 && (
                <>
                  , <strong className="text-accent-2">{parsed.errors.length}</strong> with problems (left out)
                </>
              )}
            </p>
            {parsed.errors.length > 0 && (
              <ul className="max-h-32 overflow-y-auto font-mono text-[11px] text-accent-2">
                {parsed.errors.slice(0, 50).map((e) => (
                  <li key={e.index}>
                    row {e.index + 1}: {e.message}
                  </li>
                ))}
                {parsed.errors.length > 50 && <li>… and {parsed.errors.length - 50} more</li>}
              </ul>
            )}
            <button
              type="button"
              onClick={run}
              disabled={progress !== null || parsed.rows.length === 0 || !token}
              className="btn w-fit px-4 py-2 text-xs disabled:opacity-60"
            >
              Import {parsed.rows.length.toLocaleString("en")} {noun}
            </button>
          </div>
        )}

        {progress && (
          <div className="flex flex-col gap-1">
            <div
              className="h-1.5 w-full overflow-hidden bg-accent/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
            >
              <div className="h-full bg-accent transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
            <p className="font-mono text-xs text-ink-soft">
              {progress.done.toLocaleString("en")} / {progress.total.toLocaleString("en")}
            </p>
          </div>
        )}

        {runError && <p className="font-mono text-xs text-accent-2">{runError}</p>}

        {result && (
          <div className="font-mono text-xs text-ink">
            <p>
              Added {result.inserted.toLocaleString("en")} {noun}; skipped {result.skipped.length}. Stats refreshed.
            </p>
            {result.skipped.length > 0 && (
              <ul className="mt-1 max-h-32 overflow-y-auto text-ink-soft">
                {result.skipped.slice(0, 50).map((s, i) => (
                  <li key={i}>
                    {s.title} — {s.reason}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </details>
  );
}
