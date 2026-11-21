"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* The cursor picker: a Medusa medallion in the top-right corner. Click it
   and the cursor plates fan out down-left along an engraved arc, with
   sculpture fragments (scripts/cut-fragments.mjs) around them — Victory
   holding out her wreath at the top, the griffin pedestal underneath.
   The choice is kept in localStorage and set as html[data-cursor]. */

type CursorId = "plain" | "stylus" | "spear" | "quill";

const INK = "#6f3034";
const DEEP = "#450e14";
const PAPER = "#f6efe3";

/* Each cursor's artwork, drawn on a 32px grid with its hotspot. */
const ART: Record<Exclude<CursorId, "plain">, { svg: string; hot: [number, number] }> = {
  // An engraved arrowhead: burgundy, with a paper outline and a hatch line.
  stylus: {
    hot: [3, 3],
    svg: `<path d="M3 3 L25 13 L15.5 15.5 L13 25 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.6" stroke-linejoin="round"/><path d="M6.5 6.5 L15 15" stroke="${PAPER}" stroke-width="0.9" stroke-linecap="round"/>`,
  },
  // Athena's spear: a leaf blade on a short shaft, tip to the top-left.
  spear: {
    hot: [3, 3],
    svg: `<g stroke="${PAPER}" stroke-width="1.4" stroke-linejoin="round"><path d="M3 3 C9 5 13 8 14.5 12.5 L12.5 14.5 C8 13 5 9 3 3 Z" fill="${INK}"/><path d="M13 13 L27.5 27.5" stroke="${PAPER}" stroke-width="4" stroke-linecap="round"/></g><path d="M13 13 L27.5 27.5" stroke="${DEEP}" stroke-width="2" stroke-linecap="round"/><path d="M11.2 15.8 L15.8 11.2" stroke="${DEEP}" stroke-width="2.2" stroke-linecap="round"/><path d="M4.5 4.5 L12.5 12.5" stroke="${PAPER}" stroke-width="0.8"/>`,
  },
  // A quill: nib at the bottom-left, feather sweeping up-right.
  quill: {
    hot: [3, 29],
    svg: `<path d="M3 29 L9 20 C12 12 19 5 29 3 C27 13 20 20 12 23 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.4" stroke-linejoin="round"/><path d="M3 29 L22 10" stroke="${PAPER}" stroke-width="1" stroke-linecap="round"/><path d="M13 19 L10 16 M16 16 L13.5 12.5 M19 13 L17 9.5 M15 18 L18.5 19.5 M18 15 L22 15.5" stroke="${PAPER}" stroke-width="0.7" stroke-linecap="round"/>`,
  },
};

const svgDoc = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${inner}</svg>`;
const cursorUrl = (inner: string) => `url("data:image/svg+xml,${encodeURIComponent(svgDoc(inner))}")`;

const OPTIONS: { id: CursorId; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "stylus", label: "Stylus" },
  { id: "spear", label: "Spear" },
  { id: "quill", label: "Quill" },
];

/* The fan: plates on an arc from just below "left" (10°) round to just
   left of "down" (80°), measured from the medallion's centre. */
const RADIUS = 92;
const ANGLES = [10, 33.3, 56.7, 80];
const STORAGE_KEY = "cursor";

const isCursorId = (v: unknown): v is CursorId => OPTIONS.some((o) => o.id === v);

function Glyph({ id }: { id: CursorId }) {
  if (id === "plain") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden className="cp-glyph">
        <path d="M6 4 L6 25 L11 20 L14.5 28 L18 26.5 L14.5 18.5 L21 18.5 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  return <svg viewBox="0 0 32 32" aria-hidden className="cp-glyph" dangerouslySetInnerHTML={{ __html: ART[id].svg }} />;
}

export function CursorPicker() {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState<CursorId>("plain");
  const rootRef = useRef<HTMLDivElement>(null);

  // Restore the saved choice.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (isCursorId(saved)) setCursor(saved);
    } catch {}
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (cursor === "plain") delete html.dataset.cursor;
    else html.dataset.cursor = cursor;
    try {
      localStorage.setItem(STORAGE_KEY, cursor);
    } catch {}
  }, [cursor]);

  // Close on a click elsewhere or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="cp" data-open={open}>
      <style href="cursor-picker" precedence="medium">
        {CSS}
      </style>

      {/* Fragments and the arc sit behind the plates. */}
      <span aria-hidden className="cp-deco">
        <svg className="cp-arc" viewBox="-130 -10 140 140" width="140" height="140">
          <path
            d="M -118 0 A 118 118 0 0 0 0 118 L 0 66 A 66 66 0 0 1 -66 0 Z"
            fill="var(--card)"
            fillOpacity="0.85"
            stroke="var(--accent)"
            strokeOpacity="0.45"
          />
          <path d="M -112 0 A 112 112 0 0 0 0 112" fill="none" stroke="var(--accent)" strokeOpacity="0.25" />
          <path d="M -72 0 A 72 72 0 0 1 0 72" fill="none" stroke="var(--accent)" strokeOpacity="0.25" />
        </svg>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decor/fragments/victory.webp" alt="" className="cp-victory" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decor/fragments/griffins.webp" alt="" className="cp-griffins" />
      </span>

      <ul className="cp-fan" role="radiogroup" aria-label="Cursor" inert={!open}>
        {OPTIONS.map((opt, i) => {
          const a = ((ANGLES[i] ?? 0) * Math.PI) / 180;
          const style = {
            "--x": `${Math.round(-RADIUS * Math.cos(a))}px`,
            "--y": `${Math.round(RADIUS * Math.sin(a))}px`,
            "--i": i,
          } as CSSProperties;
          return (
            <li key={opt.id} className="cp-item" style={style}>
              <button
                type="button"
                role="radio"
                aria-checked={cursor === opt.id}
                aria-label={opt.label}
                className="cp-plate"
                onClick={() => {
                  setCursor(opt.id);
                  setOpen(false);
                }}
              >
                <Glyph id={opt.id} />
              </button>
              <span aria-hidden className="cp-label">
                {opt.label}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="cp-medallion"
        aria-expanded={open}
        aria-label={`Cursor: ${OPTIONS.find((o) => o.id === cursor)?.label ?? "Plain"}`}
        onClick={() => setOpen((o) => !o)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decor/fragments/medusa.webp" alt="" className="cp-face" />
        <span className="cp-badge">
          <Glyph id={cursor} />
        </span>
      </button>
    </div>
  );
}

const cursorRules = (Object.keys(ART) as (keyof typeof ART)[])
  .map((id) => {
    const { svg, hot } = ART[id];
    const sel = `html[data-cursor="${id}"]`;
    return `${sel}, ${sel} * { cursor: ${cursorUrl(svg)} ${hot[0]} ${hot[1]}, auto !important; }
${sel} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), ${sel} textarea, ${sel} [contenteditable="true"] { cursor: text !important; }`;
  })
  .join("\n");

const CSS = `
${cursorRules}

.cp {
  --cp-orb: 3.25rem;
  --cp-spring: cubic-bezier(0.34, 1.35, 0.64, 1);
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 60;
  width: var(--cp-orb);
  height: var(--cp-orb);
}
/* Only where there is a mouse, and the rail isn't on the right edge. */
@media (hover: none), (pointer: coarse), (max-width: 767px) { .cp { display: none; } }

.cp-medallion {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  background: var(--card);
  box-shadow:
    inset 0 0 0 2px var(--card),
    inset 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent),
    0 8px 18px -10px rgb(40 20 20 / 0.5);
  cursor: pointer;
  transition: transform 0.6s var(--cp-spring), box-shadow 0.3s ease;
}
.cp-medallion:hover, .cp[data-open="true"] .cp-medallion {
  box-shadow:
    inset 0 0 0 2px var(--card),
    inset 0 0 0 3px color-mix(in srgb, var(--accent) 50%, transparent),
    0 12px 24px -10px rgb(40 20 20 / 0.55);
}
.cp[data-open="true"] .cp-medallion { transform: rotate(-14deg); }
.cp-face {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  border-radius: 9999px;
  object-fit: cover;
  pointer-events: none;
}
.cp-badge {
  position: absolute;
  left: -0.3rem;
  bottom: -0.3rem;
  display: flex;
  width: 1.45rem;
  height: 1.45rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--accent) 55%, transparent);
  background: var(--card);
  color: var(--accent);
}
.cp-badge .cp-glyph { width: 0.95rem; height: 0.95rem; }

/* Fan: every plate starts tucked behind the medallion and springs out to
   its place on the arc, one after another. */
.cp-fan { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; z-index: 1; }
.cp-item {
  position: absolute;
  left: calc(50% - 1.3rem);
  top: calc(50% - 1.3rem);
  width: 2.6rem;
  height: 2.6rem;
  opacity: 0;
  transform: translate(0, 0) scale(0.3);
  transition: transform 0.5s var(--cp-spring), opacity 0.2s ease;
  transition-delay: calc((3 - var(--i)) * 30ms);
}
.cp[data-open="true"] .cp-item {
  opacity: 1;
  transform: translate(var(--x), var(--y)) scale(1);
  transition-delay: calc(var(--i) * 45ms);
}
.cp-plate {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--accent) 50%, transparent);
  background: var(--card);
  color: var(--accent);
  box-shadow:
    inset 0 0 0 2px var(--card),
    inset 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
  cursor: pointer;
  transition: transform 0.4s var(--cp-spring), background-color 0.2s ease;
}
.cp-plate:hover, .cp-plate:focus-visible { transform: scale(1.12); }
.cp-plate[aria-checked="true"] {
  background: color-mix(in srgb, var(--accent) 14%, var(--card));
  box-shadow:
    inset 0 0 0 2px var(--card),
    inset 0 0 0 3px var(--accent);
}
.cp-plate:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.cp-glyph { width: 1.35rem; height: 1.35rem; }

.cp-label {
  position: absolute;
  right: calc(100% + 0.45rem);
  top: 50%;
  translate: 0.4rem -50%;
  white-space: nowrap;
  font-family: var(--font-accent, serif);
  font-style: italic;
  font-size: 0.95rem;
  color: var(--accent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, translate 0.3s var(--cp-spring);
}
.cp-item:hover .cp-label, .cp-item:focus-within .cp-label { opacity: 1; translate: 0 -50%; }

/* Arc and sculpture, anchored on the medallion's centre. */
.cp-deco {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  z-index: 0;
  pointer-events: none;
}
.cp-arc {
  position: absolute;
  left: -130px;
  top: -10px;
  opacity: 0;
  transform: scale(0.4);
  transform-origin: 130px 10px;
  transition: transform 0.5s var(--cp-spring), opacity 0.25s ease;
}
.cp-victory, .cp-griffins {
  position: absolute;
  width: auto;
  max-width: none;
  opacity: 0;
  transition: transform 0.6s var(--cp-spring), opacity 0.35s ease;
}
/* Victory stands left of the arc, her wreath held out to the first plate. */
.cp-victory {
  left: -192px;
  top: -40px;
  height: 128px;
  transform: translate(20px, 10px) rotate(4deg);
}
/* The griffin pedestal carries the last plate. */
.cp-griffins {
  left: -50px;
  top: 116px;
  height: 64px;
  transform: translateY(-16px);
}
.cp[data-open="true"] .cp-arc { opacity: 1; transform: scale(1); }
.cp[data-open="true"] .cp-victory { opacity: 1; transform: none; transition-delay: 0.12s; }
.cp[data-open="true"] .cp-griffins { opacity: 1; transform: none; transition-delay: 0.18s; }

@media (prefers-reduced-motion: reduce) {
  .cp, .cp * { transition: none !important; }
}
`;
