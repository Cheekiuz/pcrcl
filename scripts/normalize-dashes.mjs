/**
 * Replace Unicode en/em dashes in HTML with a normal ASCII hyphen (-).
 * Run: node scripts/normalize-dashes.mjs
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dash = /[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith(".html")) await normalize(path);
  }
}

async function normalize(path) {
  const text = await readFile(path, "utf8");
  const next = text.replace(dash, "-");
  if (next !== text) {
    await writeFile(path, next);
    console.log("Normalized", path);
  }
}

await walk(root);
