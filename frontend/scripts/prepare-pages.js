const fs = require("node:fs");
const path = require("node:path");

/**
 * Post-`expo export --platform web` build step.
 *
 * 1. Cloudflare Pages strips `.html` from redirect targets and URL-encodes
 *    brackets, so redirecting to Expo Router's `[param].html` shells breaks
 *    deep links. Write the shells as extensionless files under /_shells and
 *    set their Content-Type in public/_headers instead.
 *
 * 2. Generate dist/sw.js — a workbox service worker precaching the whole
 *    static export — so the app shell (and with it the offline guest
 *    notebook backed by IndexedDB) boots with no network at all. The HTML
 *    shell registers it in production builds only.
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

async function generateServiceWorker() {
  const { generateSW } = require("workbox-build");
  const { count, size } = await generateSW({
    swDest: path.join(dist, "sw.js"),
    globDirectory: dist,
    // Precache every static asset; skip the param shells (the clean copies
    // under /_shells are included) and the generated worker itself.
    globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest,json,woff2,htm}"],
    globIgnores: ["sw.js", "page/**", "workspace/**", "workbox-*.js"],
    // Deep links (/page/<id>, /workspace/<id>) have no precached document of
    // their own — serve the app shell for any navigation (online AND
    // offline); the client router resolves the URL and IndexedDB supplies
    // the data. Without this, reloading a deep link offline dead-ends.
    navigateFallback: "/index.html",
    clientsClaim: true,
    skipWaiting: true,
    cleanupOutdatedCaches: true,
  });
  console.log(`generated sw.js (${count} files, ${(size / 1024).toFixed(0)} KiB precached)`);
}

generateServiceWorker().catch((err) => {
  console.error("service worker generation failed:", err);
  process.exit(1);
});
