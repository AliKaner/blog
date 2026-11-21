// Splits the corner branch art into a static base + swaying leafy tips.
//
//   node scripts/cut-branch.mjs <source.png>
//
// Writes public/decor/branch-*.png and src/components/texture/branchLayers.json
// (positions as % of the trimmed image, consumed by CornerDecor).
import sharp from "sharp";
import { writeFileSync } from "node:fs";

// The source has a transparent margin on the left/top; crop it so the
// branch sits flush in the page corner.
const TRIM = { left: 5, top: 5 };

// Tip layers in SOURCE px: rect + pivot (where the tip joins the bough).
// Weight ramps 0→1 from r0→r1 px away from the pivot: near the pivot the
// pixels stay in BOTH layers (duplicated) so swaying never opens a seam.
// Rects must not overlap each other.
const LAYERS = [
  { id: "tip-hang", x0: 545, y0: 85, x1: 745, y1: 222, px: 550, py: 95, r0: 12, r1: 55 },
  { id: "tip-top", x0: 690, y0: 0, x1: 900, y1: 62, px: 694, py: 44, r0: 10, r1: 45 },
  { id: "tip-mid", x0: 236, y0: 96, x1: 316, y1: 146, px: 242, py: 112, r0: 6, r1: 28 },
  { id: "tip-left", x0: 44, y0: 182, x1: 192, y1: 308, px: 190, py: 236, r0: 10, r1: 45 },
  { id: "tip-under", x0: 330, y0: 66, x1: 545, y1: 112, px: 335, py: 70, r0: 10, r1: 40 },
  { id: "tip-crown", x0: 560, y0: 0, x1: 690, y1: 70, px: 562, py: 60, r0: 10, r1: 40 },
  { id: "tip-ridge", x0: 300, y0: 0, x1: 470, y1: 52, px: 302, py: 45, r0: 10, r1: 45 },
  { id: "tip-inner", x0: 66, y0: 118, x1: 150, y1: 180, px: 148, py: 122, r0: 8, r1: 32 },
];

const src = process.argv[2];
if (!src) throw new Error("usage: node scripts/cut-branch.mjs <source.png>");

const { data: raw, info: rawInfo } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = rawInfo.width - TRIM.left;
const H = rawInfo.height - TRIM.top;
const data = Buffer.alloc(W * H * 4);
for (let y = 0; y < H; y++)
  raw.copy(data, y * W * 4, ((y + TRIM.top) * rawInfo.width + TRIM.left) * 4, ((y + TRIM.top) * rawInfo.width + TRIM.left + W) * 4);

const main = Buffer.from(data);
const meta = [];

for (const S of LAYERS) {
  // shift into trimmed coordinates
  const L = {
    ...S,
    x0: Math.max(0, S.x0 - TRIM.left), y0: Math.max(0, S.y0 - TRIM.top),
    x1: Math.min(W, S.x1 - TRIM.left), y1: Math.min(H, S.y1 - TRIM.top),
    px: S.px - TRIM.left, py: S.py - TRIM.top,
  };
  const w = L.x1 - L.x0, h = L.y1 - L.y0, buf = Buffer.alloc(w * h * 4);
  for (let y = L.y0; y < L.y1; y++)
    for (let x = L.x0; x < L.x1; x++) {
      const i = (y * W + x) * 4, o = ((y - L.y0) * w + (x - L.x0)) * 4;
      const d = Math.hypot(x - L.px, y - L.py);
      let t = Math.min(1, Math.max(0, (d - L.r0) / (L.r1 - L.r0)));
      t = t * t * (3 - 2 * t);
      // fade toward rect edges (6px) so a leaf cut by the rect blends —
      // except along the image border, where there's nothing to blend with
      const e = Math.min(x - L.x0, L.x1 - 1 - x, y - L.y0, L.y1 - 1 - y);
      // Overlap band: a point d px from the pivot moves up to ~d·sin(4°)
      // when the tip swings, so the base and tip overlap at least that much
      // along the rect edges — otherwise the swing opens a thin gap there.
      const band = 3 + d * 0.07;
      const edge = Math.min(1, e / band);
      const [cr, cg, cb] = [data[i], data[i + 1], data[i + 2]];
      // Everything moves with the tip — leaves, shadows, twigs and the pale
      // sky specks between leaves (left behind, those show as ghosts) —
      // except the beige/brown trunk, which never moves.
      const isTrunk = cr > 90 && cg > 70 && cr >= cb + 10 && cr - cg < 60;
      let moves = !isTrunk;
      if (L.id === "tip-left" && y > -x + 415) moves = false; // keep trunk side fixed
      // The photo's top edge slices leaves in a straight line. A tip touching
      // it fades out over its top rows (the base keeps them), so a swinging
      // tip never drags a hard horizontal edge down into view.
      const TOP_FADE = 16;
      const topFade = L.y0 === 0 ? Math.min(1, y / TOP_FADE) : 1;
      const atRight = L.x1 === W && W - x < 6;
      const wgt = moves ? t * (atRight ? 1 : L.y0 === 0 && y < 6 ? 1 : edge) * topFade : 0;
      buf[o] = data[i]; buf[o + 1] = data[i + 1]; buf[o + 2] = data[i + 2];
      buf[o + 3] = Math.round(data[i + 3] * wgt);
      // base loses the pixel only where the tip fully owns it
      if (wgt >= 0.999 && e >= band) main[i + 3] = 0;
    }
  await sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(`public/decor/branch-${L.id}.png`);
  const r = (n) => +n.toFixed(3);
  meta.push({
    id: L.id,
    left: r((L.x0 / W) * 100), top: r((L.y0 / H) * 100), width: r((w / W) * 100),
    ox: r(((L.px - L.x0) / w) * 100), oy: r(((L.py - L.y0) / h) * 100),
  });
}

await sharp(main, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile("public/decor/branch-base.png");
writeFileSync(
  "src/components/texture/branchLayers.json",
  JSON.stringify({ width: W, height: H, tips: meta }, null, 2) + "\n",
);
console.log(`base ${W}x${H}, ${meta.length} tips`);
