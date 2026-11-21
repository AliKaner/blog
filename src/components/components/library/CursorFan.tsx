"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";

/**
 * CursorFan — a cursor picker. A round medallion rests in place; click it
 * and the cursor choices fan out down-left along an engraved arc, each on
 * a small plate, its name appearing on hover. Picking one dresses the page
 * (or just one element) in that cursor.
 *
 *   - Cursors: "plain" (the system's), and three engraved ones — "stylus"
 *     (a hatched arrow), "spear" and "quill". Over links and buttons each
 *     turns to its inverted proof, so clickable things still read as such.
 *   - Text fields keep the text caret.
 *   - Escape or a click elsewhere closes the fan.
 *   - Hidden on touch screens, where there is no cursor to dress.
 *
 * Self-contained: React 19+, no other dependencies. Styles ship with the
 * component (one hoisted <style>); colours come from `theme`. Place it
 * yourself (e.g. `style={{ position: "fixed", top: 16, right: 16 }}`).
 *
 * @example
 *   <CursorFan storageKey="cursor" style={{ position: "fixed", top: 16, right: 16 }} />
 */

export type CursorId = "plain" | "stylus" | "spear" | "quill";

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
    svg: `<defs><clipPath id="cf-st"><path d="M4 3 L4 23.5 L9 18.8 L12.6 27 L16.2 25.4 L12.7 17.4 L19.6 17.4 Z"/></clipPath></defs>
<path d="M4 3 L4 23.5 L9 18.8 L12.6 27 L16.2 25.4 L12.7 17.4 L19.6 17.4 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.6" stroke-linejoin="round"/>
<g clip-path="url(#cf-st)" stroke="${PAPER}" stroke-width="0.55" stroke-opacity="0.55">
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
    svg: `<defs><clipPath id="cf-sp"><path d="M16 1 C19.6 5 20.2 9.6 18.1 13 L16 14.6 L13.9 13 C11.8 9.6 12.4 5 16 1 Z"/></clipPath></defs>
<g transform="rotate(-45 16 16)">
<path d="M16 17 L16 28.2" stroke="${PAPER}" stroke-width="3.8" stroke-linecap="round"/>
<path d="M16 17 L16 28.2" stroke="${DEEP}" stroke-width="2" stroke-linecap="round"/>
<path d="M14.9 20.5 H17.1 M14.9 22 H17.1 M14.9 25.2 H17.1" stroke="${PAPER}" stroke-width="0.6"/>
<path d="M16 1 C19.6 5 20.2 9.6 18.1 13 L16 14.6 L13.9 13 C11.8 9.6 12.4 5 16 1 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.3" stroke-linejoin="round"/>
<g clip-path="url(#cf-sp)" stroke="${PAPER}" stroke-width="0.5" stroke-opacity="0.6">
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
    svg: `<defs><clipPath id="cf-qu"><path d="M16 1.5 C21.4 4.6 22.4 10.6 20.4 17.4 C19.4 20.6 17.8 22.6 16.6 23.8 L15.4 23.8 C13.6 20.8 11.6 16.6 11.7 11.8 C11.8 6.8 13.4 3.6 16 1.5 Z"/></clipPath></defs>
<g transform="rotate(45 16 16)">
<path d="M16 1.5 C21.4 4.6 22.4 10.6 20.4 17.4 C19.4 20.6 17.8 22.6 16.6 23.8 L15.4 23.8 C13.6 20.8 11.6 16.6 11.7 11.8 C11.8 6.8 13.4 3.6 16 1.5 Z" fill="${INK}" stroke="${PAPER}" stroke-width="1.2" stroke-linejoin="round"/>
<g clip-path="url(#cf-qu)" stroke="${PAPER}" stroke-width="0.5" stroke-opacity="0.65" fill="none">
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

export type CursorFanTheme = {
  /** Rules, glyph and label colour. */
  accent?: string;
  /** Plate, medallion and arc fill. */
  surface?: string;
};

export type CursorFanProps = {
  /** Controlled choice. Omit to let the fan keep its own. */
  value?: CursorId;
  onChange?: (value: CursorId) => void;
  /** Uncontrolled starting choice. Default "plain". */
  defaultValue?: CursorId;
  /** Remember the choice in localStorage under this key. */
  storageKey?: string;
  /** Element that wears the cursor. Default: the whole document. */
  target?: RefObject<HTMLElement | null>;
  /** What the medallion shows. Default: an engraved rosette. */
  medallion?: ReactNode;
  /** Accessible name. Default "Cursor". */
  label?: string;
  theme?: CursorFanTheme;
  className?: string;
  style?: CSSProperties;
};

const OPTIONS: { id: CursorId; label: string }[] = [
  { id: "plain", label: "Plain" },
  { id: "stylus", label: "Stylus" },
  { id: "spear", label: "Spear" },
  { id: "quill", label: "Quill" },
];

/* The fan: plates on an arc from just below "left" round to just left of
   "down", measured from the medallion's centre. */
const RADIUS = 83;
const ANGLES = [15, 35, 55, 75];

const isCursorId = (v: unknown): v is CursorId => OPTIONS.some((o) => o.id === v);

function themeVars(theme: CursorFanTheme | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.accent) vars["--cf-accent"] = theme.accent;
  if (theme?.surface) vars["--cf-surface"] = theme.surface;
  return vars as CSSProperties;
}

function Rosette() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className="cf-rosette">
      <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="0.8" />
      {Array.from({ length: 8 }, (_, i) => (
        <ellipse key={i} cx="20" cy="11.5" rx="3.6" ry="7.5" fill="currentColor" fillOpacity="0.85" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M20 9.5 L20 15" stroke="var(--cf-surface)" strokeWidth="0.6" transform={`rotate(${i * 45} 20 20)`} />
      ))}
      <circle cx="20" cy="20" r="4.2" fill="var(--cf-surface)" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="20" r="1.6" fill="currentColor" />
    </svg>
  );
}

function Glyph({ id }: { id: CursorId }) {
  if (id === "plain") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden className="cf-glyph">
        <path d="M6 4 L6 25 L11 20 L14.5 28 L18 26.5 L14.5 18.5 L21 18.5 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  return <svg viewBox="0 0 32 32" aria-hidden className="cf-glyph" dangerouslySetInnerHTML={{ __html: ART[id].svg }} />;
}

/** Put a cursor on an element (null takes it off). "plain" on the whole
    document means: leave it alone; on a nested target it has to be set,
    to undo a dressed page around it. */
function dress(el: HTMLElement, cursor: CursorId | null, nested: boolean) {
  if (cursor === null || (cursor === "plain" && !nested)) el.removeAttribute("data-cf-cursor");
  else el.setAttribute("data-cf-cursor", cursor);
}

export function CursorFan({
  value,
  onChange,
  defaultValue = "plain",
  storageKey,
  target,
  medallion,
  label = "Cursor",
  theme,
  className,
  style,
}: CursorFanProps) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<CursorId>(defaultValue);
  const cursor = value ?? own;
  const rootRef = useRef<HTMLDivElement>(null);

  const choose = (next: CursorId) => {
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };

  // Restore a remembered choice.
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (isCursorId(saved)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (value === undefined) setOwn(saved);
        onChange?.(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Dress the target, and remember.
  useEffect(() => {
    const el = target?.current ?? document.documentElement;
    dress(el, cursor, Boolean(target));
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, cursor);
      } catch {}
    }
    return () => dress(el, null, false);
  }, [cursor, target, storageKey]);

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
    <div
      ref={rootRef}
      className={className ? `cf ${className}` : "cf"}
      data-open={open}
      style={{ ...themeVars(theme), ...style }}
    >
      <style href="cursor-fan" precedence="medium">
        {CSS}
      </style>

      {/* The engraved arc band the plates sit on. */}
      <span aria-hidden className="cf-deco">
        <svg className="cf-arc" viewBox="-110 -6 116 116" width="116" height="116">
          <path
            d="M -104 0 A 104 104 0 0 0 0 104 L 0 62 A 62 62 0 0 1 -62 0 Z"
            fill="var(--cf-surface)"
            fillOpacity="0.88"
            stroke="var(--cf-accent)"
            strokeOpacity="0.45"
          />
          <path d="M -100 0 A 100 100 0 0 0 0 100" fill="none" stroke="var(--cf-accent)" strokeOpacity="0.22" />
          <path d="M -66 0 A 66 66 0 0 1 0 66" fill="none" stroke="var(--cf-accent)" strokeOpacity="0.22" />
        </svg>
      </span>

      <ul className="cf-fan" role="radiogroup" aria-label={label} inert={!open}>
        {OPTIONS.map((opt, i) => {
          const a = ((ANGLES[i] ?? 0) * Math.PI) / 180;
          const itemStyle = {
            "--x": `${Math.round(-RADIUS * Math.cos(a))}px`,
            "--y": `${Math.round(RADIUS * Math.sin(a))}px`,
            "--i": i,
          } as CSSProperties;
          return (
            <li key={opt.id} className="cf-item" style={itemStyle}>
              <button
                type="button"
                role="radio"
                aria-checked={cursor === opt.id}
                aria-label={opt.label}
                className="cf-plate"
                onClick={() => {
                  choose(opt.id);
                  setOpen(false);
                }}
              >
                <Glyph id={opt.id} />
              </button>
              <span aria-hidden className="cf-label">
                {opt.label}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="cf-medallion"
        aria-expanded={open}
        aria-label={`${label}: ${OPTIONS.find((o) => o.id === cursor)?.label ?? "Plain"}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cf-face">{medallion ?? <Rosette />}</span>
        <span className="cf-badge">
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

/* Each owner element sets two custom properties — its cursor and its
   "clickable" cursor — and everything inside picks them up, so a nested
   owner (a demo box inside a dressed page) simply wins for its subtree. */
const T = "[data-cf-cursor]";
const clickableSel = CLICKABLE.flatMap((c) => [`${T} ${c}`, `${T} ${c} *`]).join(", ");
const textSel = [
  'input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="submit"]):not([type="button"])',
  "textarea",
  '[contenteditable="true"]',
]
  .map((c) => `${T} ${c}`)
  .join(", ");

const cursorRules = [
  `[data-cf-cursor="plain"] { --cf-cursor: auto; --cf-pointer: pointer; }`,
  ...(Object.keys(ART) as (keyof typeof ART)[]).map((id) => {
    const { svg, hot } = ART[id];
    const at = `${hot[0]} ${hot[1]}`;
    return `[data-cf-cursor="${id}"] { --cf-cursor: ${cursorUrl(svg)} ${at}, auto; --cf-pointer: ${cursorUrl(inverted(svg))} ${at}, pointer; }`;
  }),
  `${T}, ${T} * { cursor: var(--cf-cursor) !important; }`,
  `${clickableSel} { cursor: var(--cf-pointer) !important; }`,
  `${textSel} { cursor: text !important; }`,
].join("\n");

const CSS = `
${cursorRules}

.cf {
  --cf-accent: #6f3034;
  --cf-surface: #eef3f9;
  --cf-orb: 3.25rem;
  --cf-spring: cubic-bezier(0.34, 1.35, 0.64, 1);
  position: relative;
  z-index: 60;
  width: var(--cf-orb);
  height: var(--cf-orb);
}
/* Only where there is a mouse to dress up. */
@media (hover: none), (pointer: coarse) { .cf { display: none; } }

.cf-medallion {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--cf-accent) 55%, transparent);
  background: var(--cf-surface);
  box-shadow:
    inset 0 0 0 2px var(--cf-surface),
    inset 0 0 0 3px color-mix(in srgb, var(--cf-accent) 25%, transparent),
    0 8px 18px -10px rgb(40 20 20 / 0.5);
  cursor: pointer;
  transition: transform 0.6s var(--cf-spring), box-shadow 0.3s ease;
}
.cf-medallion:hover, .cf[data-open="true"] .cf-medallion {
  box-shadow:
    inset 0 0 0 2px var(--cf-surface),
    inset 0 0 0 3px color-mix(in srgb, var(--cf-accent) 50%, transparent),
    0 12px 24px -10px rgb(40 20 20 / 0.55);
}
.cf[data-open="true"] .cf-medallion { transform: rotate(-14deg); }
.cf-face {
  position: absolute;
  inset: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 9999px;
  color: var(--cf-accent);
  pointer-events: none;
}
.cf-face > img { width: 100%; height: 100%; max-width: none; object-fit: cover; }
.cf-rosette { width: 78%; height: 78%; transition: transform 0.8s var(--cf-spring); }
.cf[data-open="true"] .cf-rosette { transform: rotate(90deg); }
.cf-badge {
  position: absolute;
  left: -0.3rem;
  bottom: -0.3rem;
  display: flex;
  width: 1.45rem;
  height: 1.45rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--cf-accent) 55%, transparent);
  background: var(--cf-surface);
  color: var(--cf-accent);
}
.cf-badge .cf-glyph { width: 0.95rem; height: 0.95rem; }

/* Fan: every plate starts tucked behind the medallion and springs out to
   its place on the arc, one after another. */
.cf-fan { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; z-index: 1; }
.cf-item {
  position: absolute;
  left: calc(50% - 1rem);
  top: calc(50% - 1rem);
  width: 2rem;
  height: 2rem;
  opacity: 0;
  transform: translate(0, 0) scale(0.3);
  transition: transform 0.5s var(--cf-spring), opacity 0.2s ease;
  transition-delay: calc((3 - var(--i)) * 30ms);
}
.cf[data-open="true"] .cf-item {
  opacity: 1;
  transform: translate(var(--x), var(--y)) scale(1);
  transition-delay: calc(var(--i) * 45ms);
}
.cf-plate {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: 9999px;
  border: 1px solid color-mix(in srgb, var(--cf-accent) 50%, transparent);
  background: var(--cf-surface);
  color: var(--cf-accent);
  box-shadow:
    inset 0 0 0 2px var(--cf-surface),
    inset 0 0 0 3px color-mix(in srgb, var(--cf-accent) 22%, transparent);
  cursor: pointer;
  transition: transform 0.4s var(--cf-spring), background-color 0.2s ease;
}
.cf-plate:hover, .cf-plate:focus-visible { transform: scale(1.12); }
.cf-plate[aria-checked="true"] {
  background: color-mix(in srgb, var(--cf-accent) 14%, var(--cf-surface));
  box-shadow:
    inset 0 0 0 2px var(--cf-surface),
    inset 0 0 0 3px var(--cf-accent);
}
.cf-plate:focus-visible { outline: 2px solid var(--cf-accent); outline-offset: 2px; }
.cf-glyph { width: 1.2rem; height: 1.2rem; }

.cf-label {
  position: absolute;
  right: calc(100% + 0.45rem);
  top: 50%;
  translate: 0.4rem -50%;
  white-space: nowrap;
  font-family: inherit;
  font-style: italic;
  font-size: 0.95rem;
  color: var(--cf-accent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, translate 0.3s var(--cf-spring);
}
.cf-item:hover .cf-label, .cf-item:focus-within .cf-label { opacity: 1; translate: 0 -50%; }

/* The arc, anchored on the medallion's centre. */
.cf-deco {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  z-index: 0;
  pointer-events: none;
}
.cf-arc {
  position: absolute;
  left: -110px;
  top: -6px;
  opacity: 0;
  transform: scale(0.4);
  transform-origin: 110px 6px;
  transition: transform 0.5s var(--cf-spring), opacity 0.25s ease;
}
.cf[data-open="true"] .cf-arc { opacity: 1; transform: scale(1); }

@media (prefers-reduced-motion: reduce) {
  .cf, .cf * { transition: none !important; }
}
`;
