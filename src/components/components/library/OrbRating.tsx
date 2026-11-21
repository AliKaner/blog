"use client";

/**
 * OrbRating — a rating picker that rests as a small seal showing the
 * current choice ("All", or the number) and slides open into an engraved
 * scale: numerals over a hairline with ticks, the chosen one stamped in a
 * filled seal. Picking a value closes it again.
 *
 *   - Click the seal (or press Enter/Space on it) → the scale opens.
 *   - Click a numeral → selects it and closes; click the chosen one again,
 *     or "All", to clear.
 *   - Escape or moving focus away closes it.
 *
 * Self-contained: React 19+, no other dependencies. Styles ship with the
 * component (one hoisted <style>); colours come from `theme`. Controlled
 * (`value` + `onChange`).
 *
 * @example
 *   const [rating, setRating] = useState<number | null>(null);
 *   <OrbRating value={rating} onChange={setRating} label="Rating" />
 */

import { useId, useState, type CSSProperties, type KeyboardEvent } from "react";

export type OrbRatingTheme = {
  /** Seal, ticks and active colour. */
  accent?: string;
  /** Numeral colour. */
  ink?: string;
  /** Hairline and minor tick colour. */
  muted?: string;
  /** Seal fill at rest. */
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

function themeVars(theme: OrbRatingTheme | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.accent) vars["--or-accent"] = theme.accent;
  if (theme?.ink) vars["--or-ink"] = theme.ink;
  if (theme?.muted) vars["--or-muted"] = theme.muted;
  if (theme?.surface) vars["--or-surface"] = theme.surface;
  return vars as CSSProperties;
}

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
  const scaleId = useId();
  const [open, setOpen] = useState(false);
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const pick = (next: number | null) => {
    onChange(next);
    setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") setOpen(false);
  };

  return (
    <div
      className={className ? `or ${className}` : "or"}
      data-open={open}
      style={
        {
          ...themeVars(theme),
          "--or-steps": steps.length,
          ...style,
        } as CSSProperties
      }
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
        aria-controls={scaleId}
        aria-label={`${label}: ${value === null ? allLabel : value}`}
        data-set={value !== null}
        onClick={() => setOpen((o) => !o)}
      >
        {value === null ? allLabel : value}
      </button>

      <div id={scaleId} className="or-scale" role="radiogroup" aria-label={label} inert={!open}>
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          className="or-all"
          onClick={() => pick(null)}
        >
          {allLabel}
        </button>
        <span className="or-track">
          {steps.map((step) => (
            <button
              key={step}
              type="button"
              role="radio"
              aria-checked={value === step}
              className="or-step"
              data-major={(step - min) % majorEvery === 0}
              onClick={() => pick(value === step ? null : step)}
            >
              <span className="or-num">{step}</span>
              <span className="or-tick" aria-hidden="true" />
            </button>
          ))}
        </span>
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
  --or-step: 1.55rem;
  --or-spring: cubic-bezier(0.34, 1.25, 0.64, 1);
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  height: var(--or-orb);
}
.or, .or * { box-sizing: border-box; }

.or-seal {
  display: inline-flex;
  flex-shrink: 0;
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

/* The scale slides out to the right of the seal. */
.or-scale {
  display: inline-flex;
  align-items: flex-end;
  gap: 0.75rem;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-width 0.5s var(--or-spring), opacity 0.2s ease;
}
.or[data-open="true"] .or-scale {
  max-width: calc(4rem + var(--or-steps) * var(--or-step));
  opacity: 1;
}

.or-all {
  flex-shrink: 0;
  border: 0;
  background: none;
  padding: 0 0 0.45rem;
  color: var(--or-muted);
  font: inherit;
  font-style: italic;
  font-size: 0.95rem;
  cursor: pointer;
}
.or-all[aria-checked="true"], .or-all:hover { color: var(--or-accent); }

/* Numerals standing on a hairline, a tick under each (longer on majors). */
.or-track {
  display: inline-flex;
  flex-shrink: 0;
  border-bottom: 1px solid var(--or-muted);
}
.or-step {
  position: relative;
  display: inline-flex;
  width: var(--or-step);
  flex-direction: column;
  align-items: center;
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
}
.or-num {
  position: relative;
  display: inline-flex;
  width: 1.35rem;
  height: 1.35rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: var(--or-ink);
  font-size: 0.8rem;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.or-step:hover .or-num { color: var(--or-accent); }
.or-step[aria-checked="true"] .or-num {
  background: var(--or-accent);
  color: var(--or-surface);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--or-accent) 25%, transparent);
}
.or-tick {
  width: 1px;
  height: 4px;
  margin-top: 2px;
  background: var(--or-muted);
}
.or-step[data-major="true"] .or-tick {
  height: 7px;
  background: var(--or-accent);
}

.or-seal:focus-visible, .or-all:focus-visible, .or-step:focus-visible {
  outline: 2px solid var(--or-accent);
  outline-offset: 2px;
  border-radius: 9999px;
}

@media (prefers-reduced-motion: reduce) {
  .or, .or * { transition: none !important; }
}
`;
