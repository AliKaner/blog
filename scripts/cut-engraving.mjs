// Cuts the subject out of a scanned engraving: drops the paper, captions and
// plate lines, keeps the object (with its paper-coloured highlights inside
// the silhouette, so it reads as solid marble rather than see-through ink).
//
//   node scripts/cut-engraving.mjs <in.jpg> <out.webp> <crop> [erase...] [--h=N] [--close=N]
//
//   crop / erase rects are "x0,y0,x1,y1" in source pixels; erase rects are
//   painted paper-white first (captions that sit too close to the object).
import sharp from "sharp";

const [input, output, cropArg, ...rest] = process.argv.slice(2);
const heightArg = rest.find((a) => a.startsWith("--h="));
const OUT_H = heightArg ? Number(heightArg.slice(4)) : 1400;
// --close=N: gap-closing radius. ~6 suits 2000px scans; use ~2 for small ones.
const closeArg = rest.find((a) => a.startsWith("--close="));
const erases = rest.filter((a) => !a.startsWith("--")).map((r) => r.split(",").map(Number));
const [cx0, cy0, cx1, cy1] = cropArg.split(",").map(Number);

const INK = 165; // luminance below this counts as engraved line
const CLOSE = closeArg ? Number(closeArg.slice(8)) : 6; // px: gaps smaller than ~2×this close up

const { data: src, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const SW = info.width;
const W = cx1 - cx0, H = cy1 - cy0;
const rgb = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) src.copy(rgb, y * W * 3, ((y + cy0) * SW + cx0) * 3, ((y + cy0) * SW + cx1) * 3);

const lum = new Float32Array(W * H);
for (let k = 0; k < W * H; k++) lum[k] = 0.299 * rgb[k * 3] + 0.587 * rgb[k * 3 + 1] + 0.114 * rgb[k * 3 + 2];
for (const [x0, y0, x1, y1] of erases)
  for (let y = Math.max(0, y0 - cy0); y < Math.min(H, y1 - cy0); y++)
    for (let x = Math.max(0, x0 - cx0); x < Math.min(W, x1 - cx0); x++) lum[y * W + x] = 255;

// Separable box dilate / erode on a 0/1 mask.
function morph(m, r, dilate) {
  const tmp = new Uint8Array(W * H), out = new Uint8Array(W * H);
  const pass = (from, to, horiz) => {
    for (let a = 0; a < (horiz ? H : W); a++) {
      for (let b = 0; b < (horiz ? W : H); b++) {
        let v = dilate ? 0 : 1;
        for (let d = -r; d <= r && v === (dilate ? 0 : 1); d++) {
          const c = b + d;
          const inside = c >= 0 && c < (horiz ? W : H);
          const s = inside ? from[horiz ? a * W + c : c * W + a] : 0;
          if (dilate ? s : !s) v = dilate ? 1 : 0;
        }
        to[horiz ? a * W + b : b * W + a] = v;
      }
    }
  };
  pass(m, tmp, true);
  pass(tmp, out, false);
  return out;
}

let mask = new Uint8Array(W * H);
for (let k = 0; k < W * H; k++) mask[k] = lum[k] < INK ? 1 : 0;
mask = morph(mask, CLOSE, true);

// Keep the big connected pieces (the object); drop text and specks.
const label = new Int32Array(W * H).fill(-1);
const sizes = [];
for (let k = 0; k < W * H; k++) {
  if (!mask[k] || label[k] >= 0) continue;
  const id = sizes.length, stack = [k];
  label[k] = id;
  let n = 0;
  while (stack.length) {
    const c = stack.pop(); n++;
    const x = c % W;
    for (const d of [-1, 1, -W, W]) {
      const m = c + d;
      if (m < 0 || m >= W * H || label[m] >= 0 || !mask[m]) continue;
      if ((d === -1 && x === 0) || (d === 1 && x === W - 1)) continue;
      label[m] = id; stack.push(m);
    }
  }
  sizes.push(n);
}
const biggest = Math.max(...sizes);
const keep = new Set(sizes.map((n, i) => (n > biggest * 0.04 ? i : -1)).filter((i) => i >= 0));
for (let k = 0; k < W * H; k++) mask[k] = label[k] >= 0 && keep.has(label[k]) ? 1 : 0;

// Fill holes: anything not reachable from the border through empty space.
const outside = new Uint8Array(W * H);
const q = [];
for (let x = 0; x < W; x++) for (const y of [0, H - 1]) { const k = y * W + x; if (!mask[k] && !outside[k]) { outside[k] = 1; q.push(k); } }
for (let y = 0; y < H; y++) for (const x of [0, W - 1]) { const k = y * W + x; if (!mask[k] && !outside[k]) { outside[k] = 1; q.push(k); } }
while (q.length) {
  const c = q.pop(), x = c % W;
  for (const d of [-1, 1, -W, W]) {
    const m = c + d;
    if (m < 0 || m >= W * H || outside[m] || mask[m]) continue;
    if ((d === -1 && x === 0) || (d === 1 && x === W - 1)) continue;
    outside[m] = 1; q.push(m);
  }
}
for (let k = 0; k < W * H; k++) mask[k] = outside[k] ? 0 : 1;
// Undo the dilation so the silhouette hugs the drawn outline again.
mask = morph(mask, CLOSE - 1, false);

if (process.env.DEBUG_MASK) await sharp(Buffer.from(mask.map((v) => v * 255)), { raw: { width: W, height: H, channels: 1 } }).resize({ height: 600 }).png().toFile(process.env.DEBUG_MASK);
const rgba = Buffer.alloc(W * H * 4);
for (let k = 0; k < W * H; k++) {
  rgba[k * 4] = rgb[k * 3]; rgba[k * 4 + 1] = rgb[k * 3 + 1]; rgba[k * 4 + 2] = rgb[k * 3 + 2];
  rgba[k * 4 + 3] = mask[k] ? 255 : 0;
}
// Soften the cut edge a touch, trim, scale, and save as webp (alpha).
const alpha = await sharp(Buffer.from(mask.map((v) => v * 255)), { raw: { width: W, height: H, channels: 1 } }).blur(0.8).extractChannel(0).raw().toBuffer();
for (let k = 0; k < W * H; k++) rgba[k * 4 + 3] = alpha[k];
const trimmed = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer();
await sharp(trimmed).resize({ height: OUT_H, withoutEnlargement: true }).webp({ quality: 82, alphaQuality: 90 }).toFile(output);
const meta = await sharp(output).metadata();
console.log(`${output}: ${meta.width}x${meta.height}`);
