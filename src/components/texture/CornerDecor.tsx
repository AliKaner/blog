import type { CSSProperties } from "react";
import branchLayers from "./branchLayers.json";
import { Engraving } from "./Engraving";

/* The branch photo is split into layers (public/decor/): a static base
   (trunk + dense canopy) and eight leafy tips cut out of it. The base never
   moves — only the tips sway, each around the point where it joins the
   bough, with its own rhythm. Near each pivot the pixels exist in both the
   base and the tip, so a swaying tip never opens a seam.

   Positions come from branchLayers.json, generated together with the PNGs
   by scripts/cut-branch.mjs. Only the motion is tuned here. */
const MOTION: Record<string, { amp: number; dur: number; delay: number }> = {
  "tip-hang": { amp: 2.4, dur: 7.5, delay: 0 },
  "tip-top": { amp: -2.8, dur: 6.2, delay: -2.1 },
  "tip-mid": { amp: 4, dur: 5.4, delay: -1.3 },
  "tip-left": { amp: -2.6, dur: 8.3, delay: -4.6 },
  "tip-under": { amp: 1.8, dur: 6.8, delay: -3.4 },
  "tip-crown": { amp: -3.2, dur: 5.9, delay: -0.7 },
  "tip-ridge": { amp: 2.2, dur: 7.1, delay: -5.2 },
  "tip-inner": { amp: 3.4, dur: 4.9, delay: -2.6 },
};

const TIPS = branchLayers.tips.map((t) => ({
  ...t,
  ...(MOTION[t.id] ?? { amp: 2, dur: 7, delay: 0 }),
}));

/* Extra leaves that drop off the visible part of the branch and drift
   down the page. Drawn (not cut from the photo) in a few shapes and tints.
   Few and slow: each leaf is only visible for the first ~40% of its cycle,
   and the cycle lengths don't share factors, so drops never line up into a
   pattern and usually only one or two are in the air at once. */
const LEAF_SHAPES = {
  // broad, symmetric
  ovate: "M10 1 C17 7 18.5 16 10 26 C1.5 16 3 7 10 1 Z",
  // long and narrow
  lance: "M10 1 C14.5 8 15 17 10 27 C5 17 5.5 8 10 1 Z",
  // asymmetric, slightly curled
  curl: "M10 1 C16.5 4 19 13 12.5 26 C4 20 2 8 10 1 Z",
} as const;

type LeafShape = keyof typeof LEAF_SHAPES;

const FALLING: {
  x: number; y: number; dx: number; dy: number; rot: number;
  dur: number; delay: number; flutter: number; size: number;
  shape: LeafShape; color: string;
}[] = [
  { x: 14, y: 52, dx: 110, dy: 560, rot: 320, dur: 23, delay: 2, flutter: 1.9, size: 15, shape: "ovate", color: "#6b1f22" },
  { x: 38, y: 16, dx: 190, dy: 620, rot: -380, dur: 29, delay: 9, flutter: 2.4, size: 12, shape: "lance", color: "#7d262b" },
  { x: 24, y: 34, dx: 70, dy: 500, rot: 260, dur: 31, delay: 17, flutter: 1.6, size: 14, shape: "curl", color: "#561719" },
  { x: 46, y: 22, dx: 150, dy: 580, rot: -300, dur: 37, delay: 26, flutter: 2.1, size: 11, shape: "ovate", color: "#842a2f" },
];

function Leaf({ shape, color }: { shape: LeafShape; color: string }) {
  return (
    <svg viewBox="0 0 20 28" className="block h-full w-full">
      <path d={LEAF_SHAPES[shape]} fill={color} />
      {/* lighter half: catches the light as it tumbles */}
      <path d={LEAF_SHAPES[shape]} fill="#fff" opacity="0.1" clipPath="inset(0 50% 0 0)" />
      <path
        d="M10 3 L10 25 M10 10 L14 7.5 M10 15 L14.5 12 M10 10 L6 7.5 M10 15 L5.5 12"
        stroke="rgb(0 0 0 / 0.28)"
        strokeWidth="0.7"
        fill="none"
      />
    </svg>
  );
}

export function CornerDecor() {
  return (
    <>
      {/* Branch grows in from the top-left corner. It sits behind page
          content (main is z-10) and fades out where it reaches the text. */}
      <div
        aria-hidden
        className="decor-branch pointer-events-none fixed left-0 top-0 z-0 hidden aspect-[895/469] w-[34rem] select-none lg:block xl:w-[42rem]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decor/branch-base.png" alt="" className="absolute inset-0 block w-full" />
        {TIPS.map((t) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.id}
            src={`/decor/branch-${t.id}.png`}
            alt=""
            className="decor-tip absolute block"
            style={
              {
                left: `${t.left}%`,
                top: `${t.top}%`,
                width: `${t.width}%`,
                transformOrigin: `${t.ox}% ${t.oy}%`,
                "--amp": `${t.amp}deg`,
                animationDuration: `${t.dur}s`,
                animationDelay: `${t.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Falling leaves live in their own unmasked layer, the same size as
          the branch, so they can drift well past it down the page. */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-0 hidden aspect-[895/469] w-[34rem] select-none lg:block xl:w-[42rem]"
      >
        {FALLING.map((l, i) => (
          <span
            key={i}
            className="decor-fall absolute"
            style={
              {
                left: `${l.x}%`,
                top: `${l.y}%`,
                width: l.size,
                height: l.size * 1.4,
                "--dx": `${l.dx}px`,
                "--dy": `${l.dy}px`,
                "--rot": `${l.rot}deg`,
                animationDuration: `${l.dur}s`,
                animationDelay: `${l.delay}s`,
              } as CSSProperties
            }
          >
            <span
              className="decor-flutter block h-full w-full"
              style={{ animationDuration: `${l.flutter}s` }}
            >
              <Leaf shape={l.shape} color={l.color} />
            </span>
          </span>
        ))}
      </div>

      {/* Changes with the site section — see Engraving.tsx. */}
      <Engraving />

      {/* Glass vase in the bottom-left corner, just clear of the nav rail. */}
      <div
        aria-hidden
        className="decor-vase pointer-events-none fixed bottom-3 left-24 z-[2] hidden w-40 select-none lg:block xl:w-48"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/decor-vase.png" alt="" className="relative z-10 block w-full" />
        <div className="absolute -bottom-1 left-[2%] h-4 w-[46%] rounded-[50%] bg-ink/25 blur-md" />
      </div>
    </>
  );
}
