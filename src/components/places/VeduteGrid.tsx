import Link from "next/link";
import { formatMonthYear } from "@/lib/format";
import { toRoman } from "@/lib/roman";

export type Veduta = {
  id: string;
  slug: string;
  name: string;
  country?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  visitedAt: number;
};

/**
 * Places as a set of vedute — the landscape view plates of a print room.
 * Each place is a framed 3:2 view with an engraved caption under it: the
 * plate number ("Tav. XII"), the name in inscription capitals, then the
 * country and month in italics. Newest first; the oldest is plate I.
 */
export function VeduteGrid({ places }: { places: Veduta[] }) {
  const total = places.length;
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {places.map((place, i) => (
        <Link key={place.id} href={`/places/${place.slug}`} className="group block no-underline">
          <div className="frame aspect-[3/2] w-full overflow-hidden">
            {place.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={place.imageUrl}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover sepia-[0.15] transition-[filter] duration-300 group-hover:sepia-0"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-center font-heading text-sm uppercase tracking-[0.2em] text-accent/60">
                {place.name}
              </div>
            )}
          </div>

          <div className="mt-3 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              Tav. {toRoman(total - i)}
            </p>
            <p className="mt-1 font-heading text-base uppercase leading-snug tracking-[0.12em] text-ink transition-colors group-hover:text-accent">
              {place.name}
            </p>
            <p className="font-accent text-sm italic text-ink-soft">
              {[place.country, formatMonthYear(place.visitedAt)].filter(Boolean).join(" · ")}
            </p>
            {place.description && (
              <p className="mx-auto mt-2 line-clamp-2 max-w-[28ch] text-[13px] leading-snug text-ink-soft">
                {place.description}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

/** "12 places · 5 countries · since 2019" — one quiet line over the plates. */
export function VeduteSummary({ places }: { places: Veduta[] }) {
  const countries = new Set(places.map((p) => p.country?.trim()).filter(Boolean)).size;
  const first = Math.min(...places.map((p) => p.visitedAt));
  const figures = [
    [places.length, places.length === 1 ? "place" : "places"],
    countries > 0 ? [countries, countries === 1 ? "country" : "countries"] : null,
    [new Date(first).getFullYear(), "first"],
  ].filter((f): f is [number, string] => f !== null);
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 font-heading text-xl text-ink">
      {figures.map(([n, label], i) => (
        <span key={label} className="flex items-baseline gap-x-3">
          {i > 0 && (
            <span aria-hidden className="text-sm text-accent/50">
              ·
            </span>
          )}
          <span>
            {label === "first" ? (
              <>
                <span className="font-accent text-base italic text-ink-soft">since </span>
                {n}
              </>
            ) : (
              <>
                {n} <span className="font-accent text-base italic text-ink-soft">{label}</span>
              </>
            )}
          </span>
        </span>
      ))}
    </p>
  );
}
