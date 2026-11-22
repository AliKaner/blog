"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import sectionMeta from "@/lib/sectionMeta.json";

/* An engraved antiquity standing in the right-hand gutter, a different
   one per site section, crossfading on navigation. The images are Piranesi
   plates (public domain), cut out of their paper by
   scripts/cut-engraving.mjs.

   Sized to fit the free space right of the content column: as tall as
   80vh allows, but never wider than the gutter, so the wider pieces
   simply come out shorter. Only on xl screens — below that the gutter is
   too narrow to hold anything. */
// w/h: the file's pixel size. Small scans are never shown much larger than
// they are (see maxWidth below), so they come out smaller rather than blurry.
export const ENGRAVINGS = {
  candelabrum: { src: "/decor/engravings/candelabrum.webp", w: 465, h: 1400 },
  victory: { src: "/decor/engravings/victory.webp", w: 793, h: 1400 },
  trophy: { src: "/decor/engravings/trophy.webp", w: 922, h: 1400 },
  vase: { src: "/decor/engravings/vase.webp", w: 1024, h: 1400 },
  griffin: { src: "/decor/engravings/griffin.webp", w: 187, h: 450 },
  ivy: { src: "/decor/engravings/ivy.webp", w: 210, h: 447 },
  cinerary: { src: "/decor/engravings/cinerary.webp", w: 310, h: 572 },
  ramhead: { src: "/decor/engravings/ramhead.webp", w: 273, h: 341 },
} as const;

/** Upscale small scans by at most this much before they'd look soft. */
const MAX_UPSCALE = 1.2;

export type EngravingName = keyof typeof ENGRAVINGS;

/* Tint in the site's reds: the engraving goes greyscale, then its tones
   are remapped along a burgundy ramp. Engravings are mostly dark line
   work, so the ramp climbs to rose quickly — otherwise it turns into a
   flat red silhouette. Stops (evenly spaced, dark → light):
   --accent-2 #450e14, --accent #6f3034, dusty rose #a55a5e,
   pale rose #dcb3b1, white. Keep the first two in sync with globals.css. */
const TINT_ID = "engraving-tint";
const RAMP = ["#450e14", "#6f3034", "#a55a5e", "#dcb3b1", "#ffffff"];
const channel = (i: number) => RAMP.map((hex) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16));
const TINT = { r: channel(0), g: channel(1), b: channel(2) };
const table = (stops: number[]) => stops.map((v) => (v / 255).toFixed(3)).join(" ");

const NAMES = Object.keys(ENGRAVINGS) as EngravingName[];

const isEngraving = (name: string): name is EngravingName => name in ENGRAVINGS;

/** Each section's engraving is set in src/lib/sectionMeta.json (the same
    data the share images are built from); sub-pages (/posts/some-slug)
    use their section's; anything else gets the first. */
function engravingFor(pathname: string): EngravingName {
  let match: string = NAMES[0] ?? "candelabrum";
  for (const section of sectionMeta.sections) {
    const hit =
      section.href === "/"
        ? pathname === "/"
        : pathname === section.href || pathname.startsWith(`${section.href}/`);
    if (hit) match = section.engraving;
  }
  return isEngraving(match) ? match : "candelabrum";
}

export function Engraving() {
  const current = engravingFor(usePathname() ?? "/");
  return (
    <>
      <svg aria-hidden className="absolute h-0 w-0" focusable="false">
        <filter id={TINT_ID} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={table(TINT.r)} />
            <feFuncG type="table" tableValues={table(TINT.g)} />
            <feFuncB type="table" tableValues={table(TINT.b)} />
          </feComponentTransfer>
        </filter>
      </svg>
      {/* All four stay mounted (and loaded) so switching is instant: the
          outgoing one sinks and fades while the new one rises in. */}
      {NAMES.map((name) => {
        const { src, w, h } = ENGRAVINGS[name];
        const aspect = w / h;
        const active = name === current;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={name}
            src={src}
            alt=""
            aria-hidden
            data-engraving={name}
            data-active={active}
            // multiply lets the page's blue into the paper-white highlights, so
            // it reads as ink printed on this page rather than a pasted cutout
            className={`pointer-events-none fixed bottom-0 right-6 z-0 hidden h-auto select-none mix-blend-multiply transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none xl:block ${
              active ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
            style={
              {
                filter: `url(#${TINT_ID})`,
                // gutter = space right of the centred 48rem column (+5rem rail)
                width: `min(calc((100vw - 53rem) / 2 - 2.5rem), calc(80vh * ${aspect}), ${Math.round(w * MAX_UPSCALE)}px)`,
              } as CSSProperties
            }
          />
        );
      })}
    </>
  );
}
