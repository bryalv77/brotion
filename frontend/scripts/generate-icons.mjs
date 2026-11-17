// Generates the PWA icons (public/icons/) with zero image dependencies: a
// minimal PNG encoder (RGBA → zlib) drawing the app mark — a rounded blue
// tile with a blocky white "N". Rerun only when the design changes:
//
//   node scripts/generate-icons.js
//
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

const BG = [35, 131, 226]; // accent blue (#2383e2)
const FG = [255, 255, 255];

// ── Minimal PNG encoder ─────────────────────────────────────────────────────
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  // Filter byte 0 (None) prefixing every scanline.
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── The mark ────────────────────────────────────────────────────────────────
/** Paint one icon. `maskable` fills the full square (safe zone padding). */
function draw(size, { maskable = false } = {}) {
  const px = new Uint8ClampedArray(size * size * 4);
  const put = (x, y, [r, g, b, a]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    // Simple alpha compositing (source-over).
    if (a >= 255) {
      px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
    } else if (a > 0) {
      const outA = a + (px[i + 3] / 255) * (255 - a);
      px[i] = (r * a + px[i] * (px[i + 3] / 255) * (255 - a)) / outA;
      px[i + 1] = (g * a + px[i + 1] * (px[i + 3] / 255) * (255 - a)) / outA;
      px[i + 2] = (b * a + px[i + 2] * (px[i + 3] / 255) * (255 - a)) / outA;
      px[i + 3] = outA;
    }
  };

  // Design grid: 512 units, scaled to `size`.
  const s = size / 512;
  // Background: rounded tile (or full bleed for maskable).
  const r = maskable ? 0 : 96 * s;
  const inset = maskable ? 0 : Math.round(10 * s); // hairline margin
  const x0 = inset, y0 = inset, x1 = size - inset, y1 = size - inset;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      // Distance to the rounded-corner boundary.
      const dx = Math.max(r - (x - x0), (x - x1) + r, 0);
      const dy = Math.max(r - (y - y0), (y - y1) + r, 0);
      const d = Math.hypot(dx, dy);
      const a = d <= r ? 255 : d - r < 1.4 ? Math.round(255 * (1 - (d - r) / 1.4)) : 0;
      if (a > 0) put(x, y, [...BG, a]);
    }
  }

  // Blocky "N": two bars + stepped diagonal, kept inside the maskable
  // safe zone (central 80%).
  const g = maskable ? 0.8 : 0.86; // glyph scale vs tile
  const cx = size / 2;
  const barW = 52 * s * g;
  const glyphH = 288 * s * g;
  const glyphW = 224 * s * g;
  const top = size / 2 - glyphH / 2;
  const left = cx - glyphW / 2;
  const inBar = (x, y) =>
    x >= left && x < left + barW && y >= top && y < top + glyphH;
  const right = left + glyphW - barW;
  const inRightBar = (x, y) =>
    x >= right && x < right + barW && y >= top && y < top + glyphH;
  // Diagonal: band across the glyph whose center steps left→right top→bottom.
  const inDiag = (x, y) => {
    const t = (y - top) / glyphH; // 0..1
    const diagX = left + t * (glyphW - barW) + barW / 2;
    return Math.abs(x - diagX) < barW / 2 && y >= top && y < top + glyphH;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inBar(x, y) || inRightBar(x, y) || inDiag(x, y)) put(x, y, [...FG, 255]);
    }
  }

  return encodePng(size, size, Buffer.from(px.buffer));
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), draw(size));
  writeFileSync(join(OUT_DIR, `icon-${size}-maskable.png`), draw(size, { maskable: true }));
}
console.log(`wrote icons to ${OUT_DIR}`);
