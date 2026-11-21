"use client";

/**
 * OrbRating — a rating picker that rests as a small seal showing the
 * current choice ("All", or the number) and opens into an engraved
 * half-dial beneath it: numerals set round a double-ruled arc, ticks on
 * the rim, and a needle that swings to whichever numeral you point at.
 *
 *   - Click the seal (or Enter/Space on it) → the dial opens.
 *   - Hover a numeral → the needle swings to it; click → selects and
 *     closes. Click the chosen one again, or the "All" hub, to clear.
 *   - ←/→ move between numerals; Escape or focus leaving closes it.
 *
 * Self-contained: React 19+, no other dependencies. Styles ship with the
 * component (one hoisted <style>); colours come from `theme`. Controlled
 * (`value` + `onChange`). The dial is an overlay and nudges itself
 * sideways to stay inside the viewport.
 *
 * @example
 *   const [rating, setRating] = useState<number | null>(null);
 *   <OrbRating value={rating} onChange={setRating} label="Rating" />
 */

import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type OrbRatingTheme = {
  /** Seal, needle, majors and active colour. */
  accent?: string;
  /** Numeral colour. */
  ink?: string;
  /** Rules and minor tick colour. */
  muted?: string;
  /** Seal and dial fill. */
  surface?: string;
};

export type OrbRatingProps = {
  /** Selected value, or null for "All". */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Accessible name for the group. */
  label: string;
  min?: number;
  max?: number;
  /** Major ticks every `majorEvery` steps. Default 5. */
  majorEvery?: number;
  /** Label of the "no filter" choice. Default "All". */
  allLabel?: string;
  theme?: OrbRatingTheme;
  className?: string;
  style?: CSSProperties;
};

/* Dial geometry, in px. The hub sits at the top centre; numerals run on
   an arc from just above "left" round the bottom to just above "right". */
const W = 232;
const HUB_Y = 18;
const R_NUM = 84; // numeral ring
const R_IN = 64; // inner rule of the band
const R_OUT = 106; // outer rule of the band
const SPREAD = 164; // degrees covered by the numerals
const H = HUB_Y + R_OUT + 6;
const EDGE = 8; // keep this far from the viewport edge

function themeVars(theme: OrbRatingTheme | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.accent) vars["--or-accent"] = theme.accent;
  if (theme?.ink) vars["--or-ink"] = theme.ink;
  if (theme?.muted) vars["--or-muted"] = theme.muted;
  if (theme?.surface) vars["--or-surface"] = theme.surface;
  return vars as CSSProperties;
}

/** Angle (degrees, clockwise from +x with y pointing down) of step i. */
function angleOf(i: number, count: number) {
  const start = 90 + SPREAD / 2;
  return count > 1 ? start - (i * SPREAD) / (count - 1) : 90;
}

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: W / 2 + r * Math.cos(a), y: HUB_Y + r * Math.sin(a) };
}

const round = (n: number) => Math.round(n * 10) / 10;

export function OrbRating({
  value,
  onChange,
  label,
  min = 0,
  max = 10,
  majorEvery = 5,
  allLabel = "All",
  theme,
  className,
  style,
}: OrbRatingProps) {
  const dialId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const [shift, setShift] = useState(0);
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const count = steps.length;

  const toggle = () => {
    if (!open && rootRef.current) {
      // Keep the dial inside the viewport: measure where it would land.
      const r = rootRef.current.getBoundingClientRect();
      const centre = r.left + r.width / 2;
      const left = centre - W / 2;
      const right = centre + W / 2;
      setShift(Math.max(0, EDGE - left) - Math.max(0, right - (window.innerWidth - EDGE)));
    }
    setOpen((o) => !o);
    setHover(null);
  };

  const pick = (next: number | null) => {
    onChange(next);
    setOpen(false);
    setHover(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const buttons = Array.from(
      rootRef.current?.querySelectorAll<HTMLButtonElement>(".or-num") ?? [],
    );
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at === -1) return;
    event.preventDefault();
    const next = buttons[Math.min(buttons.length - 1, Math.max(0, at + (event.key === "ArrowRight" ? 1 : -1)))];
    next?.focus();
  };

  // The needle points at the hovered numeral, else the chosen one, else
  // hangs straight down, faint.
  const target = hover ?? value;
  const targetIndex = target === null ? -1 : steps.indexOf(target);
  const needleDeg = targetIndex === -1 ? 90 : angleOf(targetIndex, count);

  // Band and rules as one SVG.
  const outerL = polar(R_OUT, 180);
  const outerR = polar(R_OUT, 0);
  const innerL = polar(R_IN, 180);
  const innerR = polar(R_IN, 0);
  const band = `M ${outerL.x} ${outerL.y} A ${R_OUT} ${R_OUT} 0 0 0 ${outerR.x} ${outerR.y} L ${innerR.x} ${innerR.y} A ${R_IN} ${R_IN} 0 0 1 ${innerL.x} ${innerL.y} Z`;
  const ticks: { d: string; major: boolean }[] = [];
  for (let i = 0; i < count * 2 - 1; i++) {
    const deg = angleOf(i / 2, count);
    const major = i % 2 === 0 && ((steps[i / 2] ?? 0) - min) % majorEvery === 0;
    const len = i % 2 === 1 ? 3 : major ? 8 : 5;
    const a = polar(R_OUT - 4, deg);
    const b = polar(R_OUT - 4 - len, deg);
    ticks.push({ d: `M ${round(a.x)} ${round(a.y)} L ${round(b.x)} ${round(b.y)}`, major });
  }

  return (
    <div
      ref={rootRef}
      className={className ? `or ${className}` : "or"}
      data-open={open}
      style={{ ...themeVars(theme), ...style }}
      onKeyDown={onKeyDown}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <style href="orb-rating" precedence="medium">
        {CSS}
      </style>

      <button
        type="button"
        className="or-seal"
        aria-expanded={open}
        aria-controls={dialId}
        aria-label={`${label}: ${value === null ? allLabel : value}`}
        data-set={value !== null}
        onClick={toggle}
      >
        {value === null ? allLabel : value}
      </button>

      <div
        id={dialId}
        className="or-dial"
        role="radiogroup"
        aria-label={label}
        inert={!open}
        style={{ "--or-shift": `${shift}px`, width: W, height: H } as CSSProperties}
        onPointerLeave={() => setHover(null)}
      >
        <svg className="or-plate" width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <path d={band} className="or-band" />
          <path
            d={`M ${polar(R_OUT - 4, 180).x} ${HUB_Y} A ${R_OUT - 4} ${R_OUT - 4} 0 0 0 ${polar(R_OUT - 4, 0).x} ${HUB_Y}`}
            className="or-rule"
          />
          <path
            d={`M ${polar(R_IN + 4, 180).x} ${HUB_Y} A ${R_IN + 4} ${R_IN + 4} 0 0 0 ${polar(R_IN + 4, 0).x} ${HUB_Y}`}
            className="or-rule"
          />
          {ticks.map((t, i) => (
            <path key={i} d={t.d} className={t.major ? "or-tick or-tick-major" : "or-tick"} />
          ))}
        </svg>

        {/* The needle: a fine engraved pointer with a lozenge tip. */}
        <span
          className="or-needle"
          aria-hidden="true"
          data-idle={targetIndex === -1}
          style={{ "--or-angle": `${needleDeg - 90}deg` } as CSSProperties}
        >
          <svg width="10" height={R_IN - 2} viewBox={`0 0 10 ${R_IN - 2}`}>
            <path d={`M5 17 L5 ${R_IN - 14}`} stroke="currentColor" strokeWidth="1.4" />
            <path d={`M5 ${R_IN - 2} L8.2 ${R_IN - 10} L5 ${R_IN - 16} L1.8 ${R_IN - 10} Z`} fill="currentColor" />
            <path d={`M2.6 ${R_IN - 20} H7.4`} stroke="currentColor" strokeWidth="1" />
          </svg>
        </span>

        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className="or-hub"
          style={{ left: W / 2, top: HUB_Y }}
          onClick={() => pick(null)}
        >
          {allLabel}
        </button>

        {steps.map((step, i) => {
          const p = polar(R_NUM, angleOf(i, count));
          return (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={value === step}
              className="or-num"
              data-major={(step - min) % majorEvery === 0}
              style={{ left: round(p.x), top: round(p.y), "--or-i": i } as CSSProperties}
              onPointerEnter={() => setHover(step)}
              onFocus={() => setHover(step)}
              onClick={() => pick(value === step ? null : step)}
            >
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const CSS = `
.or {
  --or-accent: #6f3034;
  --or-ink: #314863;
  --or-muted: #8c9ab0;
  --or-surface: #eef3f9;
  --or-orb: 2.25rem;
  --or-spring: cubic-bezier(0.34, 1.3, 0.64, 1);
  position: relative;
  display: inline-flex;
  width: var(--or-orb);
  height: var(--or-orb);
}
.or, .or * { box-sizing: border-box; }

.or-seal {
  position: relative;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--or-orb);
  height: var(--or-orb);
  padding: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--or-accent) 60%, transparent);
  background: var(--or-surface);
  box-shadow:
    inset 0 0 0 2px var(--or-surface),
    inset 0 0 0 3px color-mix(in srgb, var(--or-accent) 25%, transparent);
  color: var(--or-accent);
  font: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.5s var(--or-spring);
}
.or-seal[data-set="true"],
.or-seal:hover,
.or[data-open="true"] .or-seal {
  background: var(--or-accent);
  color: var(--or-surface);
  box-shadow:
    inset 0 0 0 2px var(--or-accent),
    inset 0 0 0 3px color-mix(in srgb, var(--or-surface) 45%, transparent);
}
.or[data-open="true"] .or-seal { transform: rotate(-12deg); }

/* The dial hangs under the seal, its hub just below it. */
.or-dial {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: calc(100% + 0.2rem);
  transform: translateX(calc(-50% + var(--or-shift, 0px))) scale(0.6);
  transform-origin: calc(50% - var(--or-shift, 0px)) 0;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.45s var(--or-spring), opacity 0.2s ease;
}
.or[data-open="true"] .or-dial {
  transform: translateX(calc(-50% + var(--or-shift, 0px))) scale(1);
  opacity: 1;
  pointer-events: auto;
}
.or-plate { position: absolute; inset: 0; overflow: visible; }
.or-band {
  fill: var(--or-surface);
  fill-opacity: 0.94;
  stroke: color-mix(in srgb, var(--or-accent) 50%, transparent);
  stroke-width: 1;
  filter: drop-shadow(0 10px 14px rgb(40 20 20 / 0.18));
}
.or-rule { fill: none; stroke: color-mix(in srgb, var(--or-accent) 25%, transparent); stroke-width: 1; }
.or-tick { stroke: var(--or-muted); stroke-width: 1; }
.or-tick-major { stroke: var(--or-accent); stroke-width: 1.2; }

/* Numerals ride the ring; each springs in a beat after the last. */
.or-num {
  position: absolute;
  width: 1.6rem;
  height: 1.6rem;
  margin: -0.8rem 0 0 -0.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 9999px;
  background: none;
  color: var(--or-ink);
  font: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.4);
  transition: transform 0.4s var(--or-spring), opacity 0.2s ease, color 0.15s ease, background-color 0.15s ease;
}
.or[data-open="true"] .or-num {
  opacity: 1;
  transform: scale(1);
  transition-delay: calc(var(--or-i) * 18ms), calc(var(--or-i) * 18ms), 0s, 0s;
}
.or-num[data-major="true"] { color: var(--or-accent); font-weight: 600; }
.or-num:hover, .or-num:focus-visible { transform: scale(1.2); color: var(--or-accent); }
.or-num[aria-checked="true"] {
  background: var(--or-accent);
  color: var(--or-surface);
  box-shadow: 0 0 0 2px var(--or-surface), 0 0 0 3px color-mix(in srgb, var(--or-accent) 45%, transparent);
}

/* The needle, pivoting on the hub. */
.or-needle {
  position: absolute;
  left: calc(50% - 5px);
  top: ${HUB_Y}px;
  display: block;
  width: 10px;
  color: var(--or-accent);
  transform: rotate(var(--or-angle));
  transform-origin: 5px 0;
  transition: transform 0.55s var(--or-spring), opacity 0.2s ease;
  pointer-events: none;
}
.or-needle svg { display: block; }
.or-needle[data-idle="true"] { opacity: 0.3; }

.or-hub {
  position: absolute;
  width: 1.9rem;
  height: 1.9rem;
  margin: -0.95rem 0 0 -0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--or-accent) 55%, transparent);
  background: var(--or-surface);
  box-shadow: inset 0 0 0 2px var(--or-surface), inset 0 0 0 3px color-mix(in srgb, var(--or-accent) 25%, transparent);
  color: var(--or-muted);
  font: inherit;
  font-style: italic;
  font-size: 0.62rem;
  cursor: pointer;


  transition: color 0.15s ease;
}
.or-hub[aria-checked="true"], .or-hub:hover { color: var(--or-accent); }

.or-seal:focus-visible, .or-hub:focus-visible, .or-num:focus-visible {
  outline: 2px solid var(--or-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .or, .or * { transition: none !important; }
}
`;
