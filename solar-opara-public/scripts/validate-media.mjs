import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(await readFile(path.join(root, "src/data/media-catalog.json"), "utf8"));
const ids = new Set();
let bytes = 0;
for (const item of catalog.media) {
  assert(!ids.has(item.id), `Duplicate media: ${item.id}`);
  ids.add(item.id);
  assert(["owner-confirmed", "owned", "licensed"].includes(item.rightsStatus), `Unauthorized: ${item.id}`);
  assert(item.alt && item.caption && item.credit && item.sourcePage, `Missing provenance or accessibility: ${item.id}`);
  assert(item.orientation && item.width && item.height && item.variants.length, `Missing dimensions: ${item.id}`);
  for (const variant of item.variants) {
    assert(variant.src.startsWith("/media/") && !variant.src.includes(".."), `Non-local path: ${variant.src}`);
    const info = await stat(path.join(root, "public", variant.src));
    assert.equal(info.size, variant.bytes, `Stale size: ${variant.src}`);
    assert(variant.width <= item.originalWidth && variant.height <= item.originalHeight, `Upscaled: ${variant.src}`);
    assert(Math.abs(variant.width / variant.height - item.originalWidth / item.originalHeight) < .01, `Distorted: ${variant.src}`);
    assert(info.size < 400_000, `Oversized web derivative: ${variant.src}`);
    bytes += info.size;
  }
  assert(item.variants.some((variant) => variant.src === item.src));
  assert(item.variants.some((variant) => variant.src === item.fullSrc));
}
for (const slot of ["wedding", "garden", "detail"]) {
  assert(catalog.media.some((item) => item.featured.includes(slot)), `Missing feature: ${slot}`);
}
const html = await readFile(path.join(root, "index.html"), "utf8");
const { poster, desktop, mobile, sourcePage } = catalog.heroFilm;
assert(sourcePage && poster.alt, "Missing hero film provenance or accessibility");
assert(html.includes(poster.src), "Hero preload is stale");
for (const [resource, maxBytes] of [[poster.src, 400_000], [desktop, 35_000_000], [mobile, 17_000_000]]) {
  const info = await stat(path.join(root, "public", resource));
  assert(info.size > 0 && info.size <= maxBytes, `Invalid hero media size: ${resource}`);
}
for (const resource of ["/media/solar-opara-monogram.svg", "/media/hero/solar-opara-casamento-social.jpg", "/favicon.svg"]) {
  await stat(path.join(root, "public", resource));
}
const socialFiles = (await readdir(path.join(root, "public/media/social"))).filter((file) => file.endsWith(".jpg"));
assert.equal(socialFiles.length, 10, "The operator-selected social collection must contain ten photographs");
for (const file of socialFiles) {
  const info = await stat(path.join(root, "public/media/social", file));
  assert(info.size < 400_000, `Oversized social photograph: ${file}`);
  bytes += info.size;
}
for (const file of [
  "solar-atmosfera.mp4",
  "solar-detalhes.mp4",
  "solar-celebracao.mp4",
  "solar-historia-completa.mp4",
]) {
  const info = await stat(path.join(root, "public/media/film", file));
  assert(info.size < 30_000_000, `Oversized local film: ${file}`);
}
assert(!catalog.instagramAudit.completeInventory || catalog.instagramAudit.verifiedPosts > 0, "Unsubstantiated Instagram inventory");
console.log(`Verified ${ids.size} catalogued and ${socialFiles.length} operator-selected photographs; ${(bytes / 1024).toFixed(0)} KiB across local image assets.`);
