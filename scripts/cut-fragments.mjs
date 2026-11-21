// Cuts small sculpture fragments out of the engravings in public/decor/
// engravings (already cut from their paper) and tints them along the site's
// burgundy ramp, for small decorative uses (the cursor picker).
//
//   node scripts/cut-fragments.mjs
//
// Each fragment: source, crop rect [x0, y0, x1, y1], output height, and an
// optional round vignette (for pieces cut out of a relief that still has
// carved background around them).
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "public/decor/engravings";
const OUT = "public/decor/fragments";

const FRAGMENTS = [
  { name: "victory", from: "victory", crop: [365, 300, 760, 980], h: 360 },
  { name: "medusa", from: "trophy", crop: [70, 55, 260, 245], h: 200, vignette: true },
  { name: "griffins", from: "griffin", crop: [0, 250, 187, 440], h: 220 },
];

// Burgundy ramp, dark → light (same stops as src/components/texture/Engraving.tsx).
const RAMP = ["#450e14", "#6f3034", "#a55a5e", "#dcb3b1", "#ffffff"].map((hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]);
function tint(l) {
  const t = (l / 255) * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(t));
  const f = t - i;
  return RAMP[i].map((a, c) => Math.round(a + (RAMP[i + 1][c] - a) * f));
}

mkdirSync(OUT, { recursive: true });

for (const { name, from, crop, h, vignette } of FRAGMENTS) {
  const [x0, y0, x1, y1] = crop;
  const { data, info } = await sharp(`${SRC}/${from}.webp`)
    .ensureAlpha()
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .resize({ height: h })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: W, height: H } = info;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4;
      const lum = 0.299 * data[k] + 0.587 * data[k + 1] + 0.114 * data[k + 2];
      const [r, g, b] = tint(lum);
      data[k] = r;
      data[k + 1] = g;
      data[k + 2] = b;
      if (vignette) {
        // Soft round edge: full inside 70% of the radius, gone at 100%.
        const d = Math.hypot(x - W / 2, y - H / 2) / (Math.min(W, H) / 2);
        const a = Math.max(0, Math.min(1, (1 - d) / 0.3));
        data[k + 3] = Math.round(data[k + 3] * a);
      }
    }
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .trim()
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(`${OUT}/${name}.webp`);
  console.log(name, W, H);
}
