// Renders the Notuno mark (white rounded "N" on accent blue) to every icon the
// app needs. Needs `sharp` (resolved from node_modules). Rerun on design change:
//
//   node scripts/generate-icons.mjs
//
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BG = "#2383e2";

// scale < 1 shrinks the mark toward the centre (Android adaptive safe zone).
const svg = ({ bg, scale = 1 }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
${bg ? `<rect width="1024" height="1024" fill="${BG}"/>` : ""}
<g transform="translate(512 512) scale(${scale}) translate(-512 -512)">
<polyline points="312,730 312,294 712,730 712,294" fill="none" stroke="#fff" stroke-width="116" stroke-linecap="round" stroke-linejoin="round"/>
</g></svg>`;

const render = (opts, size, out) =>
  sharp(Buffer.from(svg(opts))).resize(size, size).png().toFile(join(root, out));

mkdirSync(join(root, "assets"), { recursive: true });
mkdirSync(join(root, "public", "icons"), { recursive: true });
await Promise.all([
  render({ bg: true }, 1024, "assets/icon.png"), // iOS/App Store: opaque, no alpha
  render({ bg: false, scale: 0.88 }, 1024, "assets/adaptive-icon.png"), // Android foreground
  render({ bg: true }, 48, "assets/favicon.png"),
  render({ bg: true }, 192, "public/icons/icon-192.png"),
  render({ bg: true }, 512, "public/icons/icon-512.png"),
  render({ bg: true, scale: 0.8 }, 192, "public/icons/icon-192-maskable.png"),
  render({ bg: true, scale: 0.8 }, 512, "public/icons/icon-512-maskable.png"),
  render({ bg: true }, 32, "public/favicon.png"),
]);
// App Store icon must have no alpha channel.
await sharp(join(root, "assets/icon.png")).flatten({ background: BG }).removeAlpha().png().toFile(join(root, "assets/icon.tmp.png"));
