"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* The cursor picker: a Medusa medallion in the top-right corner. Click it
   and the cursor plates fan out down-left along an engraved arc. The
   medallion is cut from an engraving (scripts/cut-fragments.mjs).
   The choice is kept in localStorage and set as html[data-cursor]. */

type CursorId = "plain" | "stylus" | "spear" | "quill";

const INK = "#6f3034";
const DEEP = "#450e14";
const PAPER = "#f6efe3";

/* Each cursor's artwork, drawn on a 32px grid with its hotspot. They're
   drawn like the engravings: burgundy bodies, a paper outline so they
   read on any background, and fine paper-coloured hatching for shade. */
const hatch = (from: number, to: number, step: number, line: (v: number) => string) => {
  const out: string[] = [];
  for (let v = from; v <= to; v += step) out.push(line(v));
  return out.join(" ");
};

const ART: Record<Exclude<CursorId, "plain">, { svg: string; hot: [number, number] }> = {
  // An engraved pointer: the classic arrow with a double plate-mark
  // outline, diagonal hatching over its shadow side and a rosette pin.
  stylus: {
    hot: [4, 3],
    svg: `<defs><clipPath id="cp-st"><path d="M4 3 L4 23.5 L9 18.8 L12.6 27 L16.2 25.4 L12.7 17.4 L19.6 17.4 Z"/></clipPath></defs>
<path d="M4 3 L4 23.5 L9 18.8 L12.6 27 L16.2 25.4 L12.7 17.4 L19.6 17.4 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.6" stroke-linejoin="round"/>
<g clip-path="url(#cp-st)" stroke="${PAPER}" stroke-width="0.55" stroke-opacity="0.55">
<path d="${hatch(-4, 30, 2.2, (v) => `M${v} 30 L${v + 16} 14`)}"/>
</g>
<path d="M5.6 6.8 L5.6 19.6 L9.4 16 L13 16 Z" fill="none" stroke="${PAPER}" stroke-width="0.6" stroke-opacity="0.8" stroke-linejoin="round"/>
<path d="M4 3 L19.6 17.4" stroke="${DEEP}" stroke-width="0.8" stroke-opacity="0.7"/>
<circle cx="14.4" cy="26.2" r="1.15" fill="${PAPER}"/><circle cx="14.4" cy="26.2" r="0.5" fill="${DEEP}"/>`,
  },
  // Athena's spear: a leaf blade with a raised midrib and hatched flank,
  // a collar with two volutes, a banded shaft and a round butt cap.
  // Drawn upright, then turned so the point is at the top-left.
  spear: {
    hot: [5, 5],
    svg: `<defs><clipPath id="cp-sp"><path d="M16 1 C19.6 5 20.2 9.6 18.1 13 L16 14.6 L13.9 13 C11.8 9.6 12.4 5 16 1 Z"/></clipPath></defs>
<g transform="rotate(-45 16 16)">
<path d="M16 17 L16 28.2" stroke="${PAPER}" stroke-width="3.8" stroke-linecap="round"/>
<path d="M16 17 L16 28.2" stroke="${DEEP}" stroke-width="2" stroke-linecap="round"/>
<path d="M14.9 20.5 H17.1 M14.9 22 H17.1 M14.9 25.2 H17.1" stroke="${PAPER}" stroke-width="0.6"/>
<path d="M16 1 C19.6 5 20.2 9.6 18.1 13 L16 14.6 L13.9 13 C11.8 9.6 12.4 5 16 1 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.3" stroke-linejoin="round"/>
<g clip-path="url(#cp-sp)" stroke="${PAPER}" stroke-width="0.5" stroke-opacity="0.6">
<path d="${hatch(4, 13, 1.6, (v) => `M16 ${v} L20 ${v + 2.2}`)}"/>
</g>
<path d="M16 2.6 L16 13.6" stroke="${PAPER}" stroke-width="0.7"/>
<rect x="13.4" y="14.4" width="5.2" height="2.4" rx="1.1" fill="${DEEP}" stroke="${PAPER}" stroke-width="0.8"/>
<path d="M13.4 15.6 C11.8 15.6 11.6 17.4 12.8 17.4 M18.6 15.6 C20.2 15.6 20.4 17.4 19.2 17.4" fill="none" stroke="${PAPER}" stroke-width="0.7" stroke-linecap="round"/>
<circle cx="16" cy="29.4" r="1.6" fill="${INK}" stroke="${PAPER}" stroke-width="0.8"/>
</g>`,
  },
  // A quill: a curved vane with barbs combed out on both sides of the
  // shaft, a split in the feather, and a slit nib at the bottom-left.
  quill: {
    hot: [5, 27],
    svg: `<defs><clipPath id="cp-qu"><path d="M16 1.5 C21.4 4.6 22.4 10.6 20.4 17.4 C19.4 20.6 17.8 22.6 16.6 23.8 L15.4 23.8 C13.6 20.8 11.6 16.6 11.7 11.8 C11.8 6.8 13.4 3.6 16 1.5 Z"/></clipPath></defs>
<g transform="rotate(45 16 16)">
<path d="M16 1.5 C21.4 4.6 22.4 10.6 20.4 17.4 C19.4 20.6 17.8 22.6 16.6 23.8 L15.4 23.8 C13.6 20.8 11.6 16.6 11.7 11.8 C11.8 6.8 13.4 3.6 16 1.5 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.2" stroke-linejoin="round"/>
<g clip-path="url(#cp-qu)" stroke="${PAPER}" stroke-width="0.5" stroke-opacity="0.65" fill="none">
<path d="${hatch(4, 22, 1.5, (v) => `M16.1 ${v} Q18.5 ${v + 0.6} 21.5 ${v + 2.4}`)}"/>
<path d="${hatch(4, 22, 1.5, (v) => `M15.9 ${v} Q13.5 ${v + 0.6} 10.5 ${v + 2.4}`)}"/>
</g>
<path d="M20.9 11.2 L18.4 12.6" stroke="${PAPER}" stroke-width="1"/>
<path d="M12 15.2 L14.2 16.2" stroke="${PAPER}" stroke-width="1"/>
<path d="M16 2.6 Q16.5 13 16 24" fill="none" stroke="${PAPER}" stroke-width="0.8"/>
<path d="M15.1 23.6 L16.9 23.6 L16.7 27.6 L16 31 L15.3 27.6 Z" fill="${DEEP}" stroke="${PAPER}" stroke-width="0.8" stroke-linejoin="round"/>
<path d="M16 27.2 L16 30.2" stroke="${PAPER}" stroke-width="0.4"/>
</g>`,
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
const RADIUS = 83;
const ANGLES = [15, 35, 55, 75];
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

      {/* The engraved arc band the plates sit on. */}
      <span aria-hidden className="cp-deco">
        <svg className="cp-arc" viewBox="-110 -6 116 116" width="116" height="116">
          <path
            d="M -104 0 A 104 104 0 0 0 0 104 L 0 62 A 62 62 0 0 1 -62 0 Z"
            fill="var(--card)"
            fillOpacity="0.88"
            stroke="var(--accent)"
            strokeOpacity="0.45"
          />
          <path d="M -100 0 A 100 100 0 0 0 0 100" fill="none" stroke="var(--accent)" strokeOpacity="0.22" />
          <path d="M -66 0 A 66 66 0 0 1 0 66" fill="none" stroke="var(--accent)" strokeOpacity="0.22" />
        </svg>
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

/* Over anything clickable the cursor turns over like a proof pulled in
   reverse — paper body, burgundy line work — so links still announce
   themselves the way the pointing hand would. */
const inverted = (svg: string) =>
  svg.replaceAll(INK, "\u0000").replaceAll(PAPER, INK).replaceAll(DEEP, INK).replaceAll("\u0000", PAPER);

const CLICKABLE = [
  "a[href]",
  "button:not(:disabled)",
  "summary",
  "select",
  "label[for]",
  '[role="button"]',
  '[role="link"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="submit"]',
  'input[type="button"]',
];

const cursorRules = (Object.keys(ART) as (keyof typeof ART)[])
  .map((id) => {
    const { svg, hot } = ART[id];
    const sel = `html[data-cursor="${id}"]`;
    const at = `${hot[0]} ${hot[1]}`;
    const clickable = CLICKABLE.flatMap((c) => [`${sel} ${c}`, `${sel} ${c} *`]).join(", ");
    return `${sel}, ${sel} * { cursor: ${cursorUrl(svg)} ${at}, auto !important; }
${clickable} { cursor: ${cursorUrl(inverted(svg))} ${at}, pointer !important; }
${sel} input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"]), ${sel} textarea, ${sel} [contenteditable="true"] { cursor: text !important; }`;
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
  left: calc(50% - 1rem);
  top: calc(50% - 1rem);
  width: 2rem;
  height: 2rem;
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
.cp-glyph { width: 1.2rem; height: 1.2rem; }

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

/* The arc, anchored on the medallion's centre. */
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
  left: -110px;
  top: -6px;
  opacity: 0;
  transform: scale(0.4);
  transform-origin: 110px 6px;
  transition: transform 0.5s var(--cp-spring), opacity 0.25s ease;
}
.cp[data-open="true"] .cp-arc { opacity: 1; transform: scale(1); }

@media (prefers-reduced-motion: reduce) {
  .cp, .cp * { transition: none !important; }
}
`;
