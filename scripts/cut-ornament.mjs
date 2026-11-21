// Turns an engraved ornament band into a line-art mask: ink → opaque,
// paper → transparent. The result is used as a CSS mask over a solid
// colour, so the ornament can be drawn in any theme colour, crisply.
//
//   node scripts/cut-ornament.mjs <in.jpg> <out.webp> <x0,y0,x1,y1> [--h=N]
import sharp from "sharp";

const [input, output, cropArg, ...rest] = process.argv.slice(2);
const [x0, y0, x1, y1] = cropArg.split(",").map(Number);
const hArg = rest.find((a) => a.startsWith("--h="));

const { data, info } = await sharp(input)
  .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });

// Paper tone varies per scan — take it from the crop's brighter pixels.
const sorted = Float32Array.from(data).sort();
const paper = sorted[Math.floor(sorted.length * 0.85)];
const ink = sorted[Math.floor(sorted.length * 0.04)];

const rgba = Buffer.alloc(info.width * info.height * 4);
for (let k = 0; k < info.width * info.height; k++) {
  const t = Math.min(1, Math.max(0, (paper - 6 - data[k]) / (paper - 6 - ink)));
  rgba[k * 4 + 3] = Math.round(Math.pow(t, 0.85) * 255);
}

let img = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } });
if (hArg) img = img.resize({ height: Number(hArg.slice(4)), withoutEnlargement: true });
await img.webp({ quality: 90, alphaQuality: 95 }).toFile(output);
const m = await sharp(output).metadata();
console.log(`${output}: ${m.width}x${m.height}`);
