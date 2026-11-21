"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { SITE_SECTIONS } from "@/lib/siteSections";

const LINKS = SITE_SECTIONS;

// Rows shrink on short screens so all 14 always fit — the rail never scrolls.
// 3rem outer margin + 1rem rail padding + 13 gaps of 6px.
const ROW_H = `min(40px, calc((100vh - 4rem - ${(LINKS.length - 1) * 6}px) / ${LINKS.length}))`;
const PAD = 8; // rail padding (p-2) — the outer bulge keeps the same margin around the pill
const CORNER = 28; // rail corner radius (rounded-[28px] on a 56px-wide rail)

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Geo = {
  side: "left" | "right";
  rowTop: number;
  rowH: number;
  rowW: number;
  /** pill's anchored edge: left (side right) or right (side left), shell-relative */
  pillEdge: number;
  pillW: number;
  /** bulge's anchored edge at the rail's outer side, shell-relative */
  bulgeEdge: number;
  bulgeW: number;
  railTop: number;
  railBottom: number;
};

const INITIAL: Geo = {
  side: "right",
  rowTop: 8,
  rowH: 40,
  rowW: 40,
  pillEdge: 8,
  pillW: 40,
  bulgeEdge: 56,
  bulgeW: 0,
  railTop: 0,
  railBottom: 0,
};

/* Two nested layers morph together, like the rail and its icon pills:
   - the OUTER glass bulge grows out of the rail's edge (with concave
     fillets where it meets the rail), keeping the rail's 8px padding;
   - the INNER pill — a copy of the hovered icon button — stretches out
     of the rail into that bulge and carries the label.
   Both slide between rows and spring open/closed. */
export function SiteNav() {
  const pathname = usePathname() ?? "/";
  const shellRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const rowRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const labelRef = useRef<HTMLSpanElement>(null);

  const [hovered, setHovered] = useState<number | null>(null);
  // Last row shown, kept after close so the label stays put while it folds.
  const [shown, setShown] = useState(0);
  const [geo, setGeo] = useState<Geo>(INITIAL);
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
    const side = r.left > window.innerWidth / 2 ? "left" : "right";
    const pillW = w.width + label.offsetWidth + 16;
    // Pill's anchored edge and the rail's outer edge, measured from the
    // shell side the layers grow away from.
    const pillEdge = side === "right" ? w.left - s.left : s.right - w.right;
    const railOuter = side === "right" ? r.right - s.left : s.right - r.left;
    setGeo({
      side,
      rowTop: w.top - s.top,
      rowH: w.height,
      rowW: w.width,
      pillEdge,
      pillW,
      bulgeEdge: railOuter,
      bulgeW: pillEdge + pillW + PAD - railOuter,
      railTop: r.top - s.top,
      railBottom: r.bottom - s.top,
    });
  }, [hovered]);

  const enter = (i: number) => {
    setSnap(hovered === null); // appear in place; slide only between rows
    setShown(i);
    setHovered(i);
  };

  const current = LINKS[shown];
  const CurrentIcon = current.icon;
  const currentActive = isActive(pathname, current.href);
  const first = shown === 0;
  const last = shown === LINKS.length - 1;
  const anchor = geo.side === "right" ? "left" : "right";

  // Touch has no hover-out, so a tapped label lingers briefly then folds away.
  const closeAfterTouch = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") window.setTimeout(() => setHovered(null), 700);
  };

  return (
    <div
      ref={shellRef}
      className="nav-shell fixed bottom-4 right-3 z-40 md:bottom-auto md:left-4 md:right-auto md:top-6"
      data-open={open}
      data-snap={snap}
      data-side={geo.side}
      onMouseLeave={() => setHovered(null)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(null);
      }}
    >
      <nav
        ref={railRef}
        aria-label="Site"
        className="nav-rail flex w-14 flex-col items-center gap-1.5 rounded-[28px] p-2"
      >
        {LINKS.map((link, i) => {
          const Icon = link.icon;
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              href={link.href}
              aria-label={link.label}
              aria-current={active ? "page" : undefined}
              data-hovered={hovered === i}
              onMouseEnter={() => enter(i)}
              onFocus={() => enter(i)}
              onPointerUp={closeAfterTouch}
              style={{ height: ROW_H, width: ROW_H }}
              className="nav-icon flex items-center justify-center text-ink-soft no-underline"
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>

      {/* OUTER layer: glass bulge + concave fillets joining it to the rail. */}
      <div
        aria-hidden
        className="nav-bulge"
        data-first={first}
        data-last={last}
        style={
          {
            top: geo.rowTop - PAD,
            [anchor]: geo.bulgeEdge,
            height: geo.rowH + PAD * 2,
            "--bulge-w": open ? `${geo.bulgeW}px` : "0px",
          } as CSSProperties
        }
      >
        <span className="nav-fillet nav-fillet-top" />
        <span className="nav-fillet nav-fillet-bottom" />
      </div>

      {/* On the first/last row the bulge is flush with the rail's end, so
          fill the rail's rounded corner there: the outline runs straight
          from the rail into the bulge instead of dipping. */}
      <span
        aria-hidden
        className="nav-corner"
        data-show={first || last}
        data-at={first ? "top" : "bottom"}
        style={{
          [anchor]: geo.bulgeEdge - CORNER,
          top: first ? geo.railTop : geo.railBottom - CORNER,
          width: CORNER,
          height: CORNER,
        }}
      />

      {/* INNER layer: the hovered icon button, stretched out with its label. */}
      <Link
        href={current.href}
        tabIndex={-1}
        aria-hidden
        className="nav-pill flex items-center no-underline"
        data-active={currentActive}
        style={
          {
            top: geo.rowTop,
            [anchor]: geo.pillEdge,
            height: geo.rowH,
            "--pill-w": open ? `${geo.pillW}px` : `${geo.rowW}px`,
            flexDirection: geo.side === "right" ? "row" : "row-reverse",
          } as CSSProperties
        }
      >
        <span
          className="flex shrink-0 items-center justify-center"
          style={{ width: geo.rowW, height: geo.rowH }}
        >
          <CurrentIcon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <span
          ref={labelRef}
          className="nav-pill-label shrink-0 whitespace-nowrap text-sm font-medium"
        >
          {current.label}
        </span>
      </Link>
    </div>
  );
}
