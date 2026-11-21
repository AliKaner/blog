"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MorphRail, type MorphRailItem } from "@/components/components/library/MorphRail";
import { SITE_SECTIONS } from "@/lib/siteSections";

const ITEMS: MorphRailItem[] = SITE_SECTIONS.map(({ href, label, icon: Icon }) => ({
  id: href,
  href,
  label,
  icon: <Icon strokeWidth={1.75} />,
}));

// Rows shrink on short screens so all 14 always fit — the rail never scrolls.
// 3rem outer margin + 1rem rail padding + 13 gaps of 6px.
const ROW_SIZE = `min(40px, calc((100vh - 4rem - ${(ITEMS.length - 1) * 6}px) / ${ITEMS.length}))`;

// The site palette, handed to the rail's own theme variables.
const THEME = {
  surface: "color-mix(in srgb, #fff 55%, var(--card))",
  ink: "var(--ink-soft)",
  accent: "var(--accent)",
  accentStrong: "var(--accent-2)",
  onAccent: "var(--paper)",
};

function activeHref(pathname: string): string | null {
  let match: string | null = null;
  for (const { href } of SITE_SECTIONS) {
    const hit =
      href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (hit) match = href;
  }
  return match;
}

/** The site's main navigation — the same MorphRail that /components shows
    and lets visitors copy. Fixed to the left edge on desktop, to the
    bottom-right corner on mobile (where it opens leftward). */
export function SiteNav() {
  const pathname = usePathname() ?? "/";
  return (
    <MorphRail
      items={ITEMS}
      activeId={activeHref(pathname)}
      rowSize={ROW_SIZE}
      position="fixed"
      theme={THEME}
      LinkComponent={Link}
      aria-label="Site"
      className="bottom-4 right-3 z-40 md:bottom-auto md:left-4 md:right-auto md:top-6"
    />
  );
}
