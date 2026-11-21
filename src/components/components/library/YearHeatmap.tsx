/**
 * YearHeatmap — a year-by-year activity grid: one row per year, one square
 * per week, newest year on top. Each square is shaded by how much happened
 * that week; hover (or focus) one for an engraved card with the week's
 * number, its dates, a count, a breakdown by kind and the entries
 * themselves — which can be links, and the card stays open while you move
 * into it.
 *
 *   - Shading is one hue, light → dark, cut at the quintiles of the busy
 *     weeks, so it separates quiet and busy weeks however full the year.
 *   - Leading years with only a stray entry or two are left out.
 *   - Month initials run along the top, each year's total on the right,
 *     a "less … more" key above; a hidden table carries the same numbers
 *     for screen readers.
 *
 * Self-contained: React 19+, no other dependencies, no client state (fine
 * in a server component). Styles ship with the component (one hoisted
 * <style>); colours and fonts come from `theme`.
 *
 * @example
 *   <YearHeatmap
 *     now={now}
 *     items={posts.map((p) => ({ date: p.publishedAt, label: p.title, href: `/posts/${p.slug}`, group: "Post" }))}
 *     LinkComponent={Link}
 *   />
 */

import type {
  AnchorHTMLAttributes,
  ComponentType,
  CSSProperties,
  ReactNode,
} from "react";

export type YearHeatmapItem = {
  /** When it happened (ms since epoch). */
  date: number;
  /** Shown in the week's card. */
  label: string;
  /** Makes the entry a link in the card. */
  href?: string;
  /** Its kind ("Movie", "Book"…), counted in the card's breakdown. */
  group?: string;
};

export type YearHeatmapTheme = {
  /** Mid shade, labels and rules. */
  accent?: string;
  /** Darkest shade (busiest weeks). */
  deep?: string;
  /** Empty weeks and the card's paper. */
  surface?: string;
  /** Entry text. */
  ink?: string;
  /** Year labels, totals, captions. */
  muted?: string;
  /** Font for the card's count and week heading. */
  displayFont?: string;
  /** Italic font for captions, months and the key. */
  italicFont?: string;
  /** Font for years, dates and totals. */
  monoFont?: string;
};

/** Anything that renders an anchor, e.g. Next.js `Link`. */
export type YearHeatmapLinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }
>;

/** A pre-counted week, for when the entries live elsewhere (e.g. a
    summary table) and only a few are kept for the card. */
export type YearHeatmapWeek = {
  /** Any moment in the week (its start is fine). Passed back to
      `weekHref` and compared with `selectedWeek` as given. */
  start: number;
  count: number;
  groups?: { group: string; count: number }[];
  /** The entries the card lists (newest first). */
  entries?: { label: string; href?: string; group?: string }[];
};

export type YearHeatmapProps = {
  /** Every entry — the component buckets them itself… */
  items?: YearHeatmapItem[];
  /** …or weeks already counted (use one or the other). */
  weeks?: YearHeatmapWeek[];
  /** Last day shown (ms), e.g. Date.now() taken outside render — passed
      in so server and client draw the same grid. */
  now: number;
  /** Words for the caption: [one, many]. Default ["thing", "things"]. */
  noun?: [string, string];
  /** A leading year needs at least this share of the busiest year's
      entries to get a row. Default 0.05. */
  sparseShare?: number;
  /** Entries listed in a week's card. Default 6. */
  maxListed?: number;
  /** Square size in px. Default 9. */
  cell?: number;
  /** Makes each active square a link (e.g. to that week in a list). */
  weekHref?: (start: number) => string;
  /** The week to mark as chosen (a `start` as passed in / handed out). */
  selectedWeek?: number;
  theme?: YearHeatmapTheme;
  LinkComponent?: YearHeatmapLinkComponent;
  className?: string;
  style?: CSSProperties;
};

type Entry = { label: string; href?: string; group?: string };
type Week = {
  /** Local start of the week (grid position). */
  start: number;
  /** The caller's own key for it. */
  source: number;
  count: number;
  groups: [string, number][];
  entries: Entry[];
};

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const GAP = 2;
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const DATE_Y = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function startOfWeek(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

/** A week belongs to the year holding its Thursday (as ISO weeks do). */
function weekYear(start: number): number {
  return new Date(start + 4 * DAY).getFullYear();
}

/** Week number within its year, 1-based. */
function weekNumber(start: number): number {
  const thursday = new Date(start + 4 * DAY);
  const jan1 = new Date(thursday.getFullYear(), 0, 1).getTime();
  return Math.floor((thursday.getTime() - jan1) / WEEK) + 1;
}

/** Lower bounds of shade levels 1..5: 1, then the quintiles of busy weeks. */
function thresholds(counts: number[]): number[] {
  const sorted = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [1, 2, 3, 4, 5];
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 1;
  const out = [1];
  for (const p of [0.2, 0.4, 0.6, 0.8]) out.push(Math.max(q(p), (out[out.length - 1] ?? 1) + 1));
  return out;
}

function levelOf(count: number, bounds: number[]): number {
  if (count <= 0) return 0;
  let l = 1;
  for (let i = 1; i < bounds.length; i++) if (count >= (bounds[i] ?? Infinity)) l = i + 1;
  return l;
}

function themeVars(t: YearHeatmapTheme | undefined, cell: number): CSSProperties {
  const vars: Record<string, string> = { "--yh-cell": `${cell}px`, "--yh-gap": `${GAP}px` };
  if (t?.accent) vars["--yh-accent"] = t.accent;
  if (t?.deep) vars["--yh-deep"] = t.deep;
  if (t?.surface) vars["--yh-surface"] = t.surface;
  if (t?.ink) vars["--yh-ink"] = t.ink;
  if (t?.muted) vars["--yh-muted"] = t.muted;
  if (t?.displayFont) vars["--yh-display"] = t.displayFont;
  if (t?.italicFont) vars["--yh-italic"] = t.italicFont;
  if (t?.monoFont) vars["--yh-mono"] = t.monoFont;
  return vars as CSSProperties;
}

/** Either input, as active weeks keyed by their local start. */
function collect(items: YearHeatmapItem[] | undefined, weeks: YearHeatmapWeek[] | undefined, maxListed: number) {
  const out = new Map<number, Week>();
  if (weeks) {
    for (const w of weeks) {
      // Key on the middle of the week so a UTC start still lands right.
      const start = startOfWeek(w.start + 3 * DAY);
      out.set(start, {
        start,
        source: w.start,
        count: w.count,
        groups: (w.groups ?? []).map((g) => [g.group, g.count] as [string, number]),
        entries: (w.entries ?? []).slice(0, maxListed),
      });
    }
    return out;
  }
  const buckets = new Map<number, YearHeatmapItem[]>();
  for (const item of items ?? []) {
    const key = startOfWeek(item.date);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(item);
    else buckets.set(key, [item]);
  }
  for (const [start, list] of buckets) {
    list.sort((a, b) => b.date - a.date);
    const groups = new Map<string, number>();
    for (const item of list) if (item.group) groups.set(item.group, (groups.get(item.group) ?? 0) + 1);
    out.set(start, {
      start,
      source: start,
      count: list.length,
      groups: [...groups.entries()].sort((a, b) => b[1] - a[1]),
      entries: list.slice(0, maxListed).map(({ label, href, group }) => ({ label, href, group })),
    });
  }
  return out;
}

export function YearHeatmap({
  items,
  weeks: weeksIn,
  now,
  noun = ["thing", "things"],
  sparseShare = 0.05,
  maxListed = 6,
  cell = 9,
  weekHref,
  selectedWeek,
  theme,
  LinkComponent,
  className,
  style,
}: YearHeatmapProps) {
  const active = collect(items, weeksIn, maxListed);
  const perYear = new Map<number, number>();
  for (const w of active.values()) {
    const y = weekYear(w.start);
    perYear.set(y, (perYear.get(y) ?? 0) + w.count);
  }

  // The first year worth a row: the earliest that isn't a stray.
  const busiest = Math.max(0, ...perYear.values());
  const startYear =
    [...perYear.entries()]
      .filter(([, n]) => n >= Math.max(1, busiest * sparseShare))
      .map(([y]) => y)
      .sort((a, b) => a - b)[0] ?? new Date(now).getFullYear();

  const years = new Map<number, Week[]>();
  for (let t = startOfWeek(new Date(startYear, 0, 4).getTime()); t <= startOfWeek(now); t += WEEK) {
    const week = active.get(t) ?? { start: t, source: t, count: 0, groups: [], entries: [] };
    const y = weekYear(t);
    const row = years.get(y);
    if (row) row.push(week);
    else years.set(y, [week]);
  }
  const rows = [...years.entries()].sort((a, b) => b[0] - a[0]);
  const all = rows.flatMap(([, w]) => w);
  const total = all.reduce((n, w) => n + w.count, 0);
  const bounds = thresholds(all.map((w) => w.count));
  const columns = Math.max(53, ...rows.map(([, w]) => w.length));
  const yearTotal = (weeks: Week[]) => weeks.reduce((n, w) => n + w.count, 0);

  const months = MONTHS.map((label, m) => {
    const day = (new Date(startYear, m, 1).getTime() - new Date(startYear, 0, 1).getTime()) / DAY;
    return { label, left: `${(Math.floor(day / 7) / columns) * 100}%` };
  });

  const range = (l: number) => {
    if (l === 0) return "nothing";
    const lo = bounds[l - 1] ?? 1;
    const next = bounds[l];
    if (next === undefined) return `${lo}+ a week`;
    return next - 1 === lo ? `${lo} a week` : `${lo}–${next - 1} a week`;
  };

  return (
    <div
      className={className ? `yh ${className}` : "yh"}
      style={{ ...themeVars(theme, cell), "--yh-cols": columns, ...style } as CSSProperties}
    >
      <style href="year-heatmap" precedence="medium">
        {CSS}
      </style>

      <div className="yh-head">
        <p className="yh-caption">
          {total.toLocaleString("en")} {total === 1 ? noun[0] : noun[1]} since {startYear}, one square per week
        </p>
        <div className="yh-key">
          <span>less</span>
          {[0, 1, 2, 3, 4, 5].map((l) => (
            <span key={l} className="yh-sq" data-level={l} title={range(l)} />
          ))}
          <span>more</span>
        </div>
      </div>

      <div className="yh-scroll">
        <div className="yh-grid">
          <div className="yh-row" aria-hidden="true">
            <span className="yh-year" />
            <div className="yh-months">
              {months.map((m, i) => (
                <span key={i} style={{ left: m.left }}>
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {rows.map(([year, weeks]) => (
            <div key={year} className="yh-row">
              <span className="yh-year">{year}</span>
              <div className="yh-weeks">
                {weeks.map((week, i) => (
                  <WeekCell
                    key={week.start}
                    week={week}
                    level={levelOf(week.count, bounds)}
                    align={i < 10 ? "start" : i > weeks.length - 11 && i > 20 ? "end" : "center"}
                    href={weekHref && week.count > 0 ? weekHref(week.source) : undefined}
                    selected={selectedWeek !== undefined && week.count > 0 && week.source === selectedWeek}
                    LinkComponent={LinkComponent}
                  />
                ))}
              </div>
              <span className="yh-total">{yearTotal(weeks).toLocaleString("en")}</span>
            </div>
          ))}
        </div>
      </div>

      <table className="yh-sr">
        <caption>Entries per year</caption>
        <thead>
          <tr>
            <th scope="col">Year</th>
            <th scope="col">Entries</th>
            <th scope="col">Active weeks</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([year, weeks]) => (
            <tr key={year}>
              <th scope="row">{year}</th>
              <td>{yearTotal(weeks)}</td>
              <td>{weeks.filter((w) => w.count > 0).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeekCell({
  week,
  level,
  align,
  href,
  selected,
  LinkComponent,
}: {
  week: Week;
  level: number;
  align: "start" | "center" | "end";
  href?: string;
  selected: boolean;
  LinkComponent?: YearHeatmapLinkComponent;
}) {
  const { count } = week;
  if (count === 0) return <span className="yh-sq" data-level={0} />;

  const end = week.start + WEEK - DAY;
  const Anchor = LinkComponent ?? "a";
  const label = `${count} in the week of ${DATE_Y.format(week.start)}`;

  return (
    <span
      className="yh-cell"
      data-selected={selected}
      tabIndex={href ? undefined : 0}
      aria-label={href ? undefined : label}
    >
      {href ? (
        <Anchor href={href} className="yh-sq-link" aria-label={label} aria-current={selected ? "true" : undefined}>
          <span className="yh-sq" data-level={level} />
        </Anchor>
      ) : (
        <span className="yh-sq" data-level={level} />
      )}
      <span className="yh-pop" data-align={align}>
        <span className="yh-card">
          <span className="yh-card-head">
            <span>
              <span className="yh-week">
                Week {weekNumber(week.start)} · {weekYear(week.start)}
              </span>
              <span className="yh-dates">
                {DATE.format(week.start)} – {DATE_Y.format(end)}
              </span>
            </span>
            <span className="yh-count">{count}</span>
          </span>

          {week.groups.length > 0 && (
            <span className="yh-breakdown">
              {week.groups.map(([g, n], i) => (
                <span key={g}>
                  {i > 0 && <span className="yh-dot"> · </span>}
                  {g} <b>{n}</b>
                </span>
              ))}
            </span>
          )}

          <span className="yh-list">
            {week.entries.map((item, i) => (
              <span key={i} className="yh-entry">
                {item.group && <span className="yh-tag">{item.group}</span>}
                {item.href ? (
                  <Anchor href={item.href} className="yh-title">
                    {item.label}
                  </Anchor>
                ) : (
                  <span className="yh-title">{item.label}</span>
                )}
              </span>
            ))}
            {count > week.entries.length && (
              <span className="yh-more">and {count - week.entries.length} more</span>
            )}
          </span>
          {href && <span className="yh-hint">Click the square to open this week</span>}
        </span>
      </span>
    </span>
  );
}

const CSS = `
.yh {
  --yh-accent: #6f3034;
  --yh-deep: #450e14;
  --yh-surface: #eef3f9;
  --yh-ink: #314863;
  --yh-muted: #6b7a8f;
  --yh-display: inherit;
  --yh-italic: inherit;
  --yh-mono: ui-monospace, monospace;
  --yh-cell: 9px;
  --yh-gap: 2px;
  position: relative;
}
.yh, .yh * { box-sizing: border-box; }

.yh-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 0.5rem 1.5rem; }
.yh-caption { margin: 0; font-family: var(--yh-mono); font-size: 0.75rem; color: var(--yh-muted); }
.yh-key .yh-sq { width: var(--yh-cell); }
.yh-key { display: flex; align-items: center; gap: 0.35rem; font-family: var(--yh-italic); font-style: italic; font-size: 0.75rem; color: var(--yh-muted); }

/* The grid fills its container: squares shrink on narrow screens (down
   from --yh-cell), so nothing scrolls and no card gets clipped. */
.yh-scroll { margin-top: 1rem; }
.yh-grid { display: flex; flex-direction: column; gap: var(--yh-gap); }
.yh-row { display: flex; align-items: center; gap: 0.5rem; }
.yh-year { width: 2.25rem; flex-shrink: 0; font-family: var(--yh-mono); font-size: 0.75rem; color: var(--yh-muted); }
.yh-total { width: 3rem; flex-shrink: 0; text-align: right; font-family: var(--yh-mono); font-size: 0.7rem; font-variant-numeric: tabular-nums; color: var(--yh-muted); }
.yh-months, .yh-weeks { flex: 1; min-width: 0; max-width: calc(var(--yh-cols) * (var(--yh-cell) + var(--yh-gap))); }
.yh-months { position: relative; height: 1rem; }
.yh-months > span { position: absolute; bottom: 0.15rem; font-family: var(--yh-italic); font-style: italic; font-size: 0.7rem; line-height: 1; color: var(--yh-muted); }
.yh-weeks { display: grid; grid-template-columns: repeat(var(--yh-cols), minmax(0, 1fr)); gap: var(--yh-gap); }

/* Squares: one hue, paper → deep. */
.yh-sq { display: block; width: 100%; aspect-ratio: 1; border-radius: 2px; background: var(--yh-surface); transition: transform 0.15s ease; }
.yh-sq[data-level="1"] { background: color-mix(in srgb, var(--yh-accent) 22%, var(--yh-surface)); }
.yh-sq[data-level="2"] { background: color-mix(in srgb, var(--yh-accent) 45%, var(--yh-surface)); }
.yh-sq[data-level="3"] { background: color-mix(in srgb, var(--yh-accent) 70%, var(--yh-surface)); }
.yh-sq[data-level="4"] { background: var(--yh-accent); }
.yh-sq[data-level="5"] { background: var(--yh-deep); }

.yh-cell { position: relative; display: block; outline: none; }
.yh-sq-link { display: block; outline: none; cursor: pointer; }
.yh-cell[data-selected="true"] .yh-sq {
  box-shadow: 0 0 0 1.5px var(--yh-surface), 0 0 0 3px var(--yh-accent);
}
.yh-cell:hover, .yh-cell:focus-within { z-index: 20; }
.yh-cell:hover .yh-sq, .yh-cell:focus-visible > .yh-sq, .yh-sq-link:focus-visible > .yh-sq {
  transform: scale(1.35);
  box-shadow: 0 0 0 1.5px var(--yh-surface), 0 0 0 2.5px var(--yh-accent);
}

/* The card. Its wrapper reaches down to the square (transparent padding),
   so the pointer can travel into the card without it closing. */
.yh-pop {
  position: absolute;
  bottom: 100%;
  left: 50%;
  padding-bottom: 0.6rem;
  width: min(16.5rem, 80vw);
  opacity: 0;
  visibility: hidden;
  transform: translate(-50%, 4px);
  transition: opacity 0.15s ease, transform 0.2s ease, visibility 0s linear 0.15s;
}
.yh-pop[data-align="start"] { left: calc(var(--yh-cell) * -1.5); transform: translate(0, 4px); }
.yh-pop[data-align="end"] { left: auto; right: calc(var(--yh-cell) * -1.5); transform: translate(0, 4px); }
.yh-cell:hover > .yh-pop, .yh-cell:focus-within > .yh-pop {
  opacity: 1;
  visibility: visible;
  transform: translate(-50%, 0);
  transition-delay: 0s;
}
.yh-cell:hover > .yh-pop[data-align="start"], .yh-cell:focus-within > .yh-pop[data-align="start"],
.yh-cell:hover > .yh-pop[data-align="end"], .yh-cell:focus-within > .yh-pop[data-align="end"] { transform: none; }

.yh-card {
  position: relative;
  display: block;
  padding: 0.75rem 0.85rem 0.7rem;
  background: var(--yh-surface);
  border: 1px solid color-mix(in srgb, var(--yh-accent) 45%, transparent);
  box-shadow:
    inset 0 0 0 3px var(--yh-surface),
    inset 0 0 0 4px color-mix(in srgb, var(--yh-accent) 22%, transparent),
    0 14px 28px -14px rgb(40 20 20 / 0.45);
}
/* The pointer: a small lozenge on the card's lower edge, over the square. */
.yh-card::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  background: var(--yh-surface);
  border-right: 1px solid color-mix(in srgb, var(--yh-accent) 45%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--yh-accent) 45%, transparent);
  transform: rotate(45deg);
}
.yh-pop[data-align="start"] .yh-card::after { left: calc(var(--yh-cell) * 2); }
.yh-pop[data-align="end"] .yh-card::after { left: auto; right: calc(var(--yh-cell) * 2 - 8px); }

.yh-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 3px double color-mix(in srgb, var(--yh-accent) 35%, transparent);
}
.yh-week { display: block; font-family: var(--yh-display); font-size: 0.72rem; letter-spacing: 0.16em; text-transform: uppercase; color: var(--yh-accent); }
.yh-dates { display: block; margin-top: 0.1rem; font-family: var(--yh-italic); font-style: italic; font-size: 0.85rem; color: var(--yh-muted); }
.yh-count { font-family: var(--yh-display); font-size: 1.75rem; line-height: 1; color: var(--yh-accent); }

.yh-breakdown { display: block; margin-top: 0.45rem; font-family: var(--yh-italic); font-style: italic; font-size: 0.82rem; color: var(--yh-muted); }
.yh-breakdown b { font-family: var(--yh-mono); font-style: normal; font-weight: 500; font-size: 0.72rem; color: var(--yh-accent); }
.yh-dot { color: color-mix(in srgb, var(--yh-accent) 50%, transparent); }

.yh-list { display: flex; flex-direction: column; gap: 0.2rem; margin-top: 0.5rem; }
.yh-entry { display: flex; align-items: baseline; gap: 0.45rem; min-width: 0; }
.yh-tag {
  flex-shrink: 0;
  width: 3.4rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--yh-mono);
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--yh-accent) 75%, transparent);
}
.yh-title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
  color: var(--yh-ink);
  text-decoration: none;
}
a.yh-title:hover, a.yh-title:focus-visible { color: var(--yh-accent); text-decoration: underline; text-underline-offset: 2px; }
.yh-hint { display: block; margin-top: 0.45rem; padding-top: 0.35rem; border-top: 1px solid color-mix(in srgb, var(--yh-accent) 18%, transparent); font-family: var(--yh-italic); font-style: italic; font-size: 0.72rem; color: var(--yh-muted); }
.yh-more { margin-top: 0.15rem; font-family: var(--yh-italic); font-style: italic; font-size: 0.8rem; color: var(--yh-muted); }

.yh-sr {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .yh, .yh * { transition: none !important; }
}
`;
