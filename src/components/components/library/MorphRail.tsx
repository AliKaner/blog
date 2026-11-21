"use client";

/**
 * MorphRail — a glass icon rail whose hover state morphs in two layers.
 *
 * Hover a row and:
 *   - the OUTER layer, a glass bulge, grows out of the rail's edge, joined
 *     to it by two concave fillets (on the first/last row the rail's own
 *     rounded corner squares off instead, so the edge runs straight on);
 *   - the INNER layer, a copy of the hovered icon button, stretches out of
 *     the rail into that bulge and carries the label.
 * Both slide between rows and spring open/closed.
 *
 * Self-contained: React 19+, no other dependencies. Styles ship with the
 * component (a single hoisted <style>); colours come from `theme`.
 *
 * @example
 *   <MorphRail
 *     items={[
 *       { id: "home", label: "Home", icon: <HomeIcon />, href: "/" },
 *       { id: "search", label: "Search", icon: <SearchIcon /> },
 *     ]}
 *     activeId="home"
 *     onSelect={(id) => console.log(id)}
 *   />
 */

import {
  useLayoutEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";

export type MorphRailItem = {
  id: string;
  label: string;
  /** Any icon element, e.g. <HomeIcon />. Sized to 18px by the rail. */
  icon: ReactNode;
  /** Renders the row as a link. Without it the row is a button that calls
      `onSelect`. */
  href?: string;
};

export type MorphRailTheme = {
  /** Glass base colour (rail, bulge, idle rows). */
  surface?: string;
  /** Idle icon colour. */
  ink?: string;
  /** Hover tint, active fill, label colour. */
  accent?: string;
  /** Darker end of the active fill gradient. */
  accentStrong?: string;
  /** Icon/label colour on the active fill. */
  onAccent?: string;
};

/** Anything that renders an anchor, e.g. Next.js `Link`. */
export type MorphRailLinkComponent = ComponentType<
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  }
>;

export type MorphRailProps = {
  items: readonly MorphRailItem[];
  /** Id of the current item (shown filled). */
  activeId?: string | null;
  onSelect?: (id: string) => void;
  /** Which way the label opens. "auto" opens away from the nearer
      viewport edge. Default "auto". */
  side?: "left" | "right" | "auto";
  /** CSS length for each square row. Default "40px". */
  rowSize?: string;
  /** CSS position of the rail. Default "relative". */
  position?: CSSProperties["position"];
  theme?: MorphRailTheme;
  /** Used for items with an `href`. Default: a plain <a>. */
  LinkComponent?: MorphRailLinkComponent;
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
};

const PAD = 8; // rail padding; the bulge keeps the same margin around the pill
const SEAM = 1; // px the bulge overlaps the rail, hiding the join

type Geometry = {
  side: "left" | "right";
  rowTop: number;
  rowH: number;
  rowW: number;
  /** Pill's anchored edge (left for side "right", right for side "left"). */
  pillEdge: number;
  pillW: number;
  /** Bulge's anchored edge at the rail's outer side. */
  bulgeEdge: number;
  bulgeW: number;
};

const INITIAL: Geometry = {
  side: "right",
  rowTop: PAD,
  rowH: 40,
  rowW: 40,
  pillEdge: PAD,
  pillW: 40,
  bulgeEdge: 56,
  bulgeW: 0,
};

type RowProps = {
  item: MorphRailItem;
  children: ReactNode;
  LinkComponent?: MorphRailLinkComponent;
  onPick?: (id: string) => void;
  elementRef?: (el: HTMLElement | null) => void;
} & Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect">;

/** A row: a link when the item has an href, otherwise a button. */
function Row({ item, children, LinkComponent, onPick, elementRef, ...rest }: RowProps) {
  if (item.href !== undefined) {
    const anchorRef = elementRef as Ref<HTMLAnchorElement> | undefined;
    if (LinkComponent) {
      return (
        <LinkComponent href={item.href} ref={anchorRef} {...rest}>
          {children}
        </LinkComponent>
      );
    }
    return (
      <a href={item.href} ref={anchorRef} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      ref={elementRef as Ref<HTMLButtonElement> | undefined}
      onClick={() => onPick?.(item.id)}
      {...rest}
    >
      {children}
    </button>
  );
}

function themeVars(theme: MorphRailTheme | undefined): CSSProperties {
  const vars: Record<string, string> = {};
  if (theme?.surface) vars["--mr-surface"] = theme.surface;
  if (theme?.ink) vars["--mr-ink"] = theme.ink;
  if (theme?.accent) vars["--mr-accent"] = theme.accent;
  if (theme?.accentStrong) vars["--mr-accent-strong"] = theme.accentStrong;
  if (theme?.onAccent) vars["--mr-on-accent"] = theme.onAccent;
  return vars as CSSProperties;
}

export function MorphRail({
  items,
  activeId = null,
  onSelect,
  side = "auto",
  rowSize = "40px",
  position = "relative",
  theme,
  LinkComponent,
  className,
  style,
  "aria-label": ariaLabel = "Navigation",
}: MorphRailProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [hovered, setHovered] = useState<number | null>(null);
  // Last row shown, kept after close so the label stays put while it folds.
  const [shown, setShown] = useState(0);
  const [geo, setGeo] = useState<Geometry>(INITIAL);
  const [snap, setSnap] = useState(true);

  const open = hovered !== null;

  // Measure the hovered row, the rail and the label so both layers fit.
  useLayoutEffect(() => {
    if (hovered === null) return;
    const shell = shellRef.current;
    const rail = railRef.current;
    const row = rowRefs.current[hovered];
    const label = labelRef.current;
    if (!shell || !rail || !row || !label) return;
    const s = shell.getBoundingClientRect();
    const r = rail.getBoundingClientRect();
    const w = row.getBoundingClientRect();
    const resolved =
      side === "auto" ? (r.left > window.innerWidth / 2 ? "left" : "right") : side;
    // Whole pixels throughout: fractional edges get antialiased, and two
    // translucent edges meeting on a half pixel show the background through.
    const px = Math.round;
    const pillW = px(w.width + label.offsetWidth + 16);
    const pillEdge = px(resolved === "right" ? w.left - s.left : s.right - w.right);
    const railOuter = px(resolved === "right" ? r.right - s.left : s.right - r.left);
    setGeo({
      side: resolved,
      rowTop: px(w.top - s.top),
      rowH: px(w.height),
      rowW: px(w.width),
      pillEdge,
      pillW,
      // The bulge tucks SEAM px under the rail so their edges overlap
      // instead of merely touching — no hairline gap at the join.
      bulgeEdge: railOuter - SEAM,
      bulgeW: pillEdge + pillW + PAD - railOuter + SEAM,
    });
  }, [hovered, side]);

  const firstItem = items[0];
  if (!firstItem) return null;

  const enter = (index: number) => {
    setSnap(hovered === null); // appear in place; slide only between rows
    setShown(index);
    setHovered(index);
  };

  // Touch has no hover-out, so a tapped label lingers briefly then folds.
  const closeAfterTouch = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") window.setTimeout(() => setHovered(null), 700);
  };

  const current = items[Math.min(shown, items.length - 1)] ?? firstItem;
  const first = shown === 0;
  const last = shown === items.length - 1;
  const anchor = geo.side === "right" ? "left" : "right";

  return (
    <div
      ref={shellRef}
      className={className ? `mr-shell ${className}` : "mr-shell"}
      style={{ position, ...themeVars(theme), ...style }}
      data-open={open}
      data-snap={snap}
      data-side={geo.side}
      onMouseLeave={() => setHovered(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHovered(null);
      }}
    >
      <style href="morph-rail" precedence="medium">
        {CSS}
      </style>

      {/* On the first/last row the rail squares off its own corner on the
          bulge side, so its edge runs straight into the bulge. */}
      <nav
        ref={railRef}
        aria-label={ariaLabel}
        className="mr-rail"
        data-flat={open && first ? "top" : open && last ? "bottom" : undefined}
      >
        {items.map((item, index) => (
          <Row
            key={item.id}
            item={item}
            LinkComponent={LinkComponent}
            onPick={onSelect}
            elementRef={(el) => {
              rowRefs.current[index] = el;
            }}
            aria-label={item.label}
            aria-current={item.id === activeId ? "page" : undefined}
            data-hovered={hovered === index}
            onMouseEnter={() => enter(index)}
            onFocus={() => enter(index)}
            onPointerUp={closeAfterTouch}
            className="mr-row"
            style={{ width: rowSize, height: rowSize }}
          >
            <span className="mr-glyph" aria-hidden>
              {item.icon}
            </span>
          </Row>
        ))}
      </nav>

      {/* OUTER layer: glass bulge + concave fillets joining it to the rail. */}
      <div
        aria-hidden
        className="mr-bulge"
        data-first={first}
        data-last={last}
        style={
          {
            top: geo.rowTop - PAD,
            [anchor]: geo.bulgeEdge,
            height: geo.rowH + PAD * 2,
            "--mr-bulge-w": open ? `${geo.bulgeW}px` : "0px",
          } as CSSProperties
        }
      >
        <span className="mr-fillet mr-fillet-top" />
        <span className="mr-fillet mr-fillet-bottom" />
      </div>

      {/* INNER layer: the hovered row, stretched out with its label. */}
      <Row
        item={current}
        LinkComponent={LinkComponent}
        onPick={onSelect}
        tabIndex={-1}
        aria-hidden
        className="mr-pill"
        data-active={current.id === activeId}
        style={
          {
            top: geo.rowTop,
            [anchor]: geo.pillEdge,
            height: geo.rowH,
            "--mr-pill-w": open ? `${geo.pillW}px` : `${geo.rowW}px`,
            flexDirection: geo.side === "right" ? "row" : "row-reverse",
          } as CSSProperties
        }
      >
        <span className="mr-pill-glyph" style={{ width: geo.rowW, height: geo.rowH }}>
          <span className="mr-glyph">{current.icon}</span>
        </span>
        <span ref={labelRef} className="mr-label">
          {current.label}
        </span>
      </Row>
    </div>
  );
}

const CSS = `
.mr-shell {
  --mr-surface: #eef3f9;
  --mr-ink: #4a5d75;
  --mr-accent: #6f3034;
  --mr-accent-strong: #450e14;
  --mr-on-accent: #ffffff;
  --mr-glass: color-mix(in srgb, var(--mr-surface) 86%, transparent);
  --mr-blur: blur(18px) saturate(160%);
  --mr-fillet: 14px;
  /* Springy, for opening/closing. */
  --mr-morph: cubic-bezier(0.34, 1.35, 0.64, 1);
  /* No overshoot, for sliding between rows: a spring there would push the
     bulge past the rail's ends on the first/last row. */
  --mr-slide: cubic-bezier(0.22, 1, 0.36, 1);
  --mr-slide-time: 0.4s;
}
.mr-shell, .mr-shell * { box-sizing: border-box; }

.mr-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 56px;
  padding: 8px;
  border-radius: 28px;
  background: var(--mr-glass);
  backdrop-filter: var(--mr-blur);
  -webkit-backdrop-filter: var(--mr-blur);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.6),
    0 10px 20px -8px rgb(0 0 0 / 0.3),
    0 28px 48px -20px rgb(0 0 0 / 0.4);
  transition: border-radius 0.12s ease;
}

/* First/last row open: square the corner that meets the bulge — but only
   once a sliding bulge has (nearly) arrived, or it reads as a notch. */
.mr-shell[data-side="right"] .mr-rail[data-flat="top"] { border-top-right-radius: 0; }
.mr-shell[data-side="right"] .mr-rail[data-flat="bottom"] { border-bottom-right-radius: 0; }
.mr-shell[data-side="left"] .mr-rail[data-flat="top"] { border-top-left-radius: 0; }
.mr-shell[data-side="left"] .mr-rail[data-flat="bottom"] { border-bottom-left-radius: 0; }
.mr-rail[data-flat] {
  transition: border-radius 0.15s ease calc(var(--mr-slide-time) * 0.6);
}
/* Opening fresh on that row: no wait. */
.mr-shell[data-snap="true"] .mr-rail[data-flat] { transition-delay: 0s; }

.mr-row, .mr-pill {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}

.mr-row {
  position: relative;
  flex-shrink: 0;
  justify-content: center;
  border-radius: 9999px;
  color: var(--mr-ink);
  background: linear-gradient(145deg,
    color-mix(in srgb, var(--mr-surface) 65%, transparent),
    color-mix(in srgb, var(--mr-surface) 40%, transparent));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.4),
    inset 0 -1px 1px rgb(0 0 0 / 0.08),
    0 1px 2px rgb(0 0 0 / 0.15);
  transition: color 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
}
.mr-row[data-hovered="true"] {
  color: var(--mr-accent);
  background: linear-gradient(145deg,
    color-mix(in srgb, var(--mr-accent) 22%, transparent),
    color-mix(in srgb, var(--mr-surface) 55%, transparent));
}
.mr-row[aria-current="page"] {
  color: var(--mr-on-accent);
  background: linear-gradient(145deg, var(--mr-accent), var(--mr-accent-strong));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.3),
    0 4px 10px -4px color-mix(in srgb, var(--mr-accent-strong) 70%, transparent);
}
.mr-row:active {
  box-shadow: inset 0 1px 2px rgb(0 0 0 / 0.18), 0 1px 2px rgb(0 0 0 / 0.1);
}
.mr-row:focus-visible, .mr-pill:focus-visible {
  outline: 2px solid var(--mr-accent);
  outline-offset: 2px;
}

.mr-glyph {
  display: inline-flex;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.mr-glyph > svg { width: 100%; height: 100%; }

.mr-bulge, .mr-fillet {
  background: var(--mr-glass);
  backdrop-filter: var(--mr-blur);
  -webkit-backdrop-filter: var(--mr-blur);
}

.mr-bulge {
  position: absolute;
  width: var(--mr-bulge-w, 0px);
  border-radius: 0 9999px 9999px 0;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.5),
    10px 12px 22px -14px rgb(0 0 0 / 0.45);
  pointer-events: none;
  transform-origin: left center;
  transition:
    top var(--mr-slide-time) var(--mr-slide),
    width 0.45s var(--mr-morph),
    opacity 0.2s ease,
    transform 0.4s var(--mr-morph);
}

.mr-fillet {
  position: absolute;
  left: 0;
  width: var(--mr-fillet);
  height: var(--mr-fillet);
  transition: opacity 0.12s ease;
}
.mr-fillet-top {
  bottom: 100%;
  mask: radial-gradient(circle at 100% 0, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
  -webkit-mask: radial-gradient(circle at 100% 0, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
}
.mr-fillet-bottom {
  top: 100%;
  mask: radial-gradient(circle at 100% 100%, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
  -webkit-mask: radial-gradient(circle at 100% 100%, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
}
/* No fillet past the rail's ends — the rail squares off there instead. */
.mr-bulge[data-first="true"] .mr-fillet-top,
.mr-bulge[data-last="true"] .mr-fillet-bottom { opacity: 0; }

.mr-pill {
  position: absolute;
  width: var(--mr-pill-w);
  overflow: hidden;
  border-radius: 9999px;
  color: var(--mr-accent);
  background: linear-gradient(145deg,
    color-mix(in srgb, var(--mr-accent) 16%, var(--mr-glass)),
    color-mix(in srgb, #fff 40%, var(--mr-glass)));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.6),
    inset 0 -1px 1px rgb(0 0 0 / 0.08),
    0 2px 6px -2px rgb(0 0 0 / 0.25);
  transition:
    top var(--mr-slide-time) var(--mr-slide),
    width 0.45s var(--mr-morph),
    opacity 0.18s ease;
}
.mr-pill[data-active="true"] {
  color: var(--mr-on-accent);
  background: linear-gradient(145deg, var(--mr-accent), var(--mr-accent-strong));
}
.mr-pill-glyph {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
.mr-label {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 500;
  transition: opacity 0.2s ease 0.1s;
}

.mr-shell[data-open="false"] .mr-bulge { opacity: 0; transform: scaleX(0.2); }
.mr-shell[data-open="false"] .mr-pill { opacity: 0; pointer-events: none; }
.mr-shell[data-open="false"] .mr-label { opacity: 0; transition-delay: 0s; }

/* Appearing from nothing: snap to the row instead of sliding in. */
.mr-shell[data-snap="true"] .mr-bulge,
.mr-shell[data-snap="true"] .mr-pill { transition-property: width, opacity, transform; }

/* Opening to the left mirrors every piece. */
.mr-shell[data-side="left"] .mr-bulge {
  border-radius: 9999px 0 0 9999px;
  transform-origin: right center;
}
.mr-shell[data-side="left"] .mr-fillet { left: auto; right: 0; }
.mr-shell[data-side="left"] .mr-fillet-top {
  mask: radial-gradient(circle at 0 0, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
  -webkit-mask: radial-gradient(circle at 0 0, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
}
.mr-shell[data-side="left"] .mr-fillet-bottom {
  mask: radial-gradient(circle at 0 100%, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
  -webkit-mask: radial-gradient(circle at 0 100%, transparent calc(var(--mr-fillet) - 0.5px), #000 var(--mr-fillet));
}
@media (prefers-reduced-motion: reduce) {
  .mr-shell *, .mr-shell *::before, .mr-shell *::after { transition: none !important; }
}
`;
