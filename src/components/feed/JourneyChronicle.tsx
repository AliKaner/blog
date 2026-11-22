import Link from "next/link";
import type { ReactNode } from "react";
import { FEED_TYPE_PATH, type FeedItemType } from "@/lib/feedTypes";

type Item = {
  type: FeedItemType;
  id: string;
  slug: string;
  title: string;
  date: number;
  imageUrl?: string | null;
  rating?: number | null;
};

const VERB: Record<FeedItemType, string> = {
  movie: "Watched",
  book: "Read",
  place: "Visited",
  cocktail: "Mixed",
  post: "Wrote",
  softwareLog: "Logged",
};

/* Sculpture cut from the engravings (scripts/cut-fragments.mjs), tinted in
   the house burgundy: round fragments behind the initials, whole
   statuettes as tailpieces. Each month takes the next in turn. */
const FRAGMENTS = ["medusa-right", "atlas", "griffins", "masks", "shield-boss", "plinth-rose"];
const STATUES = ["statue-griffin", "statue-cinerary", "statue-ramhead", "statue-candelabrum", "statue-victory", "statue-vase"];
const piece = (name: string) => `/decor/fragments/${name}.webp`;

/** Most posters a day hangs in the margin before they move beneath it. */
const MARGIN = 3;

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "UTC" });
const DAY = fmt({ day: "2-digit" });
const MON = fmt({ month: "short" });
const MONTH = fmt({ month: "long" });
const YEAR = fmt({ year: "numeric" });

const href = (i: Item) => `${FEED_TYPE_PATH[i.type]}/${i.slug}`;
const dayKey = (d: number) => Math.floor(d / 86_400_000);
const monthKey = (d: number) => `${YEAR.format(d)}-${MONTH.format(d)}`;
const entries = (n: number) => `${n} ${n === 1 ? "entry" : "entries"}`;

/** Newest-first items → months → days. */
function byMonth(items: Item[]) {
  const months: { date: number; days: { date: number; items: Item[] }[] }[] = [];
  for (const item of items) {
    const month = months[months.length - 1];
    if (!month || monthKey(month.date) !== monthKey(item.date)) {
      months.push({ date: item.date, days: [{ date: item.date, items: [item] }] });
      continue;
    }
    const day = month.days[month.days.length - 1];
    if (dayKey(day.date) === dayKey(item.date)) day.items.push(item);
    else month.days.push({ date: item.date, items: [item] });
  }
  return months;
}

/** A run longer than this names its first few and folds the rest away. */
const LONG_RUN = 5;
const SHOWN = 3;

function Title({ item, sep }: { item: Item; sep: string }) {
  return (
    <span>
      {sep}
      <Link href={href(item)} className="link-ornate italic">
        {item.title}
      </Link>
      {typeof item.rating === "number" && <span className="text-ink-soft">, {item.rating}/10</span>}
    </span>
  );
}

/** One day as one sentence: "Watched X, 6/10; Y and read Z." The verb is
    said once for a run of the same kind, and a binge ("ep22; ep21; …")
    names three and folds the rest behind "and 19 more". */
function Sentence({ items }: { items: Item[] }) {
  const runs: Item[][] = [];
  for (const item of items) {
    const run = runs[runs.length - 1];
    if (run && run[0].type === item.type) run.push(item);
    else runs.push([item]);
  }
  const parts: ReactNode[] = runs.map((run, r) => {
    const verb = VERB[run[0].type];
    const folded = run.length > LONG_RUN ? run.slice(SHOWN) : [];
    const shown = folded.length > 0 ? run.slice(0, SHOWN) : run;
    return (
      <span key={`${run[0].type}-${run[0].id}`}>
        {r > 0 && (r === runs.length - 1 ? " and " : "; ")}
        <span className="text-ink-soft">{r === 0 ? verb : verb.toLowerCase()} </span>
        {shown.map((item, k) => (
          <Title key={item.id} item={item} sep={k > 0 ? "; " : ""} />
        ))}
        {folded.length > 0 && (
          <details className="group/more inline [&[open]::details-content]:inline">
            <summary className="inline cursor-pointer list-none text-ink-soft underline decoration-dotted underline-offset-4 hover:text-accent group-open/more:hidden [&::-webkit-details-marker]:hidden">
              {" "}and {folded.length} more…
            </summary>
            {folded.map((item) => (
              <Title key={item.id} item={item} sep="; " />
            ))}
          </details>
        )}
      </span>
    );
  });
  return (
    <>
      {parts}
      <span className="text-ink-soft">.</span>
    </>
  );
}

/**
 * The Journey as an illuminated chronicle: each month opens with its
 * initial cut over a sculpture fragment, each day is one sentence with its
 * posters hung in the margin, and a statuette closes the month.
 */
export function JourneyChronicle({
  items,
  highlight,
}: {
  items: Item[];
  /** Marks the days it returns true for (a week picked in the heatmap). */
  highlight?: (date: number) => boolean;
}) {
  return (
    <div className="flex flex-col gap-12">
      {byMonth(items).map((m) => {
        const name = MONTH.format(m.date);
        // Turn by calendar month, so a month keeps its sculpture as pages load.
        const turn = Number(YEAR.format(m.date)) * 12 + new Date(m.date).getUTCMonth();
        return (
          <section key={monthKey(m.date)}>
            <h3 className="flex items-center gap-4 font-heading text-ink">
              <span aria-hidden className="frame relative flex size-16 shrink-0 items-center justify-center overflow-hidden !p-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={piece(FRAGMENTS[turn % FRAGMENTS.length])}
                  alt=""
                  className="absolute inset-0 size-full max-w-none scale-125 object-cover opacity-80"
                />
                <span
                  className="relative text-5xl leading-none text-paper"
                  style={{ textShadow: "0 0 2px var(--accent-2), 0 0 6px var(--accent-2), 0 1px 0 var(--accent-2)" }}
                >
                  {name[0]}
                </span>
              </span>
              <span className="flex flex-col">
                <span className="sr-only">{name[0]}</span>
                <span className="text-2xl uppercase leading-none tracking-[0.14em]">{name.slice(1)}</span>
                <span className="mt-1 font-accent text-lg italic text-ink-soft">
                  {YEAR.format(m.date)} · {entries(m.days.reduce((n, d) => n + d.items.length, 0))}
                </span>
              </span>
            </h3>

            <div className="mt-4 flex flex-col font-accent text-lg leading-relaxed text-ink">
              {m.days.map((d) => {
                const pics = d.items.filter((i) => i.imageUrl);
                const marked = highlight?.(d.date);
                // A few posters hang in the margin beside the line; a crowded
                // day (or a narrow screen) lays them in a row beneath it.
                const margin = pics.length <= MARGIN;
                return (
                  <div
                    key={dayKey(d.date)}
                    className={`grid grid-cols-1 items-start gap-x-4 gap-y-2 ${margin ? "sm:grid-cols-[1fr_auto]" : ""} border-b border-dotted border-border py-2 last:border-0 ${
                      marked ? "-ml-4 border-l-[3px] border-l-accent border-double pl-[13px]" : ""
                    }`}
                  >
                    <div>
                      <time dateTime={new Date(d.date).toISOString().slice(0, 10)} className="font-mono text-[11px] not-italic tracking-[0.1em] text-accent">
                        {MON.format(d.date).toUpperCase()} {DAY.format(d.date)}
                      </time>{" "}
                      <Sentence items={d.items} />
                    </div>
                    {pics.length > 0 && (
                      <span className={`flex flex-wrap gap-1.5 ${margin ? "sm:flex-nowrap" : ""}`}>
                        {pics.map((i) => (
                          <Link
                            key={`${i.type}-${i.id}`}
                            href={href(i)}
                            title={i.title}
                            tabIndex={-1}
                            className="block transition-transform hover:-translate-y-0.5"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={i.imageUrl!} alt="" loading="lazy" className="frame frame-sm h-12 w-8 shrink-0 object-cover" />
                          </Link>
                        ))}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div aria-hidden className="mt-6 flex items-end justify-center gap-4">
              <span className="mb-1 h-[3px] w-16 border-y border-border" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={piece(STATUES[turn % STATUES.length])} alt="" className="h-16 w-auto max-w-none opacity-90" />
              <span className="mb-1 h-[3px] w-16 border-y border-border" />
            </div>
          </section>
        );
      })}
    </div>
  );
}
