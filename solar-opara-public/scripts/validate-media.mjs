import { readFile, stat } from "node:fs/promises";
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
for (const slot of ["hero", "wedding", "garden", "detail"]) {
  assert(catalog.media.some((item) => item.featured.includes(slot)), `Missing feature: ${slot}`);
}
const html = await readFile(path.join(root, "index.html"), "utf8");
const hero = catalog.media.find((item) => item.featured.includes("hero"));
assert(html.includes(hero.src), "Hero preload is stale");
for (const resource of ["/media/solar-opara-monogram.svg", "/media/hero/solar-opara-casamento-social.jpg", "/favicon.svg"]) {
  await stat(path.join(root, "public", resource));
}
assert(!catalog.instagramAudit.completeInventory || catalog.instagramAudit.verifiedPosts > 0, "Unsubstantiated Instagram inventory");
console.log(`Verified ${ids.size} authorized photographs; ${(bytes / 1024).toFixed(0)} KiB across all responsive derivatives.`);
