const fs = require("node:fs");
const path = require("node:path");

/**
 * Cloudflare Pages strips `.html` from redirect targets and URL-encodes
 * brackets, so redirecting to Expo Router's `[param].html` shells breaks deep
 * links. Write the shells as extensionless files under /_shells and set their
 * Content-Type in public/_headers instead.
 */
const dist = path.join(__dirname, "..", "dist");
const scriptsDir = path.join(dist, "_shells");
fs.mkdirSync(scriptsDir, { recursive: true });

const copies = [
  ["page/[pageId].html", "page.htm"],
  ["workspace/[wsId].html", "workspace.htm"],
  ["workspace/[wsId]/trash.html", "trash.htm"],
];

for (const [from, to] of copies) {
  const src = path.join(dist, from);
  const dst = path.join(scriptsDir, to);
  if (!fs.existsSync(src)) throw new Error(`Missing static export: ${from}`);
  fs.copyFileSync(src, dst);
  console.log(`prepared _shells/${to}`);
}
