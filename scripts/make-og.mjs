// Builds the social share images (Open Graph / Twitter, 1200×630) for the
// home page and every section, in the site's own look: blue paper, the
// section's engraving tinted with the site's burgundy ramp, the branch in
// the corner, a plate-mark border, Palatino lettering and the rosette band.
//
//   node scripts/make-og.mjs
//
// Writes src/app/[section/]opengraph-image.png + .alt.txt, which Next.js
// picks up as og:image (and X falls back to og:image for its card).
// Text is rendered with the local "Palatino Linotype" font; the PNGs are
// committed, so the font only needs to exist where this script runs.
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const W = 1200;
const H = 630;
const PAPER = "#d3e1f1";
const INK = "#314863";
const INK_SOFT = "#45597a";
const ACCENT = "#6f3034";
// Same tint ramp as the site's engraving filter (Engraving.tsx), dark → light.
const RAMP = ["#450e14", "#6f3034", "#a55a5e", "#dcb3b1", "#ffffff"].map((h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
]);
const FONT = "Palatino Linotype, Palatino, Georgia, serif";

const meta = JSON.parse(readFileSync("src/lib/sectionMeta.json", "utf8"));

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Greedy word wrap to at most `max` characters per line. */
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    if ((line + " " + word).trim().length > max && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  return lines;
}

/** Engraving → burgundy duotone, as the site's SVG filter does. */
async function tintedEngraving(name, maxW, maxH) {
  const { data, info } = await sharp(`public/decor/engravings/${name}.webp`)
    .resize({ width: maxW, height: maxH, fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const l = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
    const t = l * (RAMP.length - 1);
    const k = Math.min(RAMP.length - 2, Math.floor(t));
    const f = t - k;
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(RAMP[k][c] * (1 - f) + RAMP[k + 1][c] * f);
  }
  const png = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  return { png, width: info.width, height: info.height };
}

/** The branch for the top-left corner, fading out to the right. */
async function branch(width) {
  const resized = await sharp("public/decor/branch-base.png").resize({ width }).png().toBuffer();
  const { height } = await sharp(resized).metadata();
  const fade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0.45" stop-color="#fff"/><stop offset="0.95" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
  return sharp(resized).composite([{ input: fade, blend: "dest-in" }]).png().toBuffer();
}

/** The rosette band, painted in the accent colour. */
async function band(width) {
  const mask = await sharp("public/decor/ornaments/rosette.webp").resize({ width }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = mask;
  const [r, g, b] = [0x6f, 0x30, 0x34];
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = Math.round(a * 0.85);
  }
  return { png: await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(), height: info.height };
}

async function render({ label, title, lines, engraving, out, alt }) {
  const eng = await tintedEngraving(engraving, 400, 520);
  const br = await branch(460);
  const bd = await band(300);

  const textX = 96;
  const titleY = 330;
  const bandY = titleY + 22;
  const linesY = bandY + bd.height + 52;
  const titleSize = title.length > 9 ? 70 : 86;

  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <!-- plate mark -->
    <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${ACCENT}" stroke-opacity="0.55" stroke-width="1.5"/>
    <rect x="31" y="31" width="${W - 62}" height="${H - 62}" fill="none" stroke="${ACCENT}" stroke-opacity="0.25" stroke-width="1"/>
    <text x="${textX}" y="${titleY - titleSize - 14}" font-family="${FONT}" font-size="20" letter-spacing="6" fill="${INK_SOFT}">${esc(label.toUpperCase())}</text>
    <text x="${textX}" y="${titleY}" font-family="${FONT}" font-size="${titleSize}" letter-spacing="5" fill="${INK}">${esc(title.toUpperCase())}</text>
    ${lines
      .map(
        (line, i) =>
          `<text x="${textX}" y="${linesY + i * 40}" font-family="${FONT}" font-style="italic" font-size="31" fill="${ACCENT}">${esc(line)}</text>`,
      )
      .join("\n")}
  </svg>`);

  await sharp({ create: { width: W, height: H, channels: 4, background: PAPER } })
    .composite([
      { input: br, left: 0, top: 0 },
      { input: eng.png, left: W - 90 - eng.width, top: H - 46 - eng.height, blend: "multiply" },
      { input: bd.png, left: textX, top: bandY },
      { input: overlay, left: 0, top: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);
  writeFileSync(out.replace(/\.png$/, ".alt.txt"), alt);
  console.log(out);
}

// Home-screen icon (iOS), matching src/app/icon.svg at 180px. iOS rounds
// the corners itself, so the plate is drawn square.
async function appleIcon() {
  const S = 180;
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
    <rect width="${S}" height="${S}" fill="${PAPER}"/>
    <rect x="14" y="14" width="${S - 28}" height="${S - 28}" fill="none" stroke="${ACCENT}" stroke-opacity="0.75" stroke-width="4"/>
    <rect x="26" y="26" width="${S - 52}" height="${S - 52}" fill="none" stroke="${ACCENT}" stroke-opacity="0.35" stroke-width="2"/>
    <text x="${S / 2}" y="${S / 2 + 38}" text-anchor="middle" font-family="${FONT}" font-size="112" fill="${ACCENT}">A</text>
  </svg>`);
  await sharp(svg).png({ compressionLevel: 9 }).toFile("src/app/apple-icon.png");
  console.log("src/app/apple-icon.png");
}

await appleIcon();

for (const section of meta.sections) {
  const isHome = section.href === "/";
  const dir = isHome ? "src/app" : `src/app${section.href}`;
  await render({
    label: isHome ? "alikaner.com" : "Ali Kaner",
    title: isHome ? "Ali Kaner" : section.title,
    lines: wrap(isHome ? meta.home.subtitle : section.description, 34).slice(0, 2),
    engraving: section.engraving,
    out: `${dir}/opengraph-image.png`,
    alt: isHome
      ? "Ali Kaner — Senior Fullstack Developer, with an engraved candelabrum"
      : `${section.title} — Ali Kaner. ${section.description}`,
  });
}
