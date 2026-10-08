/**
 * Normalize dash-like punctuation across the static site.
 * Run: npm run normalize-dashes
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".html", ".js", ".md", ".txt"]);

const longDash = /\s*[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]\s*/g;
const dotSeparator = / \u00b7 /g;

function normalizeText(text) {
  return text
    .replace(longDash, " - ")
    .replace(dotSeparator, " - ")
    .replace(/<\/a>\s+\/\s+/g, "</a> - ")
    .replace(/\s*\u2192\s*/g, " - ");
}

function normalizeHtml(text) {
  const blocks = [];
  let next = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, (block) => {
    blocks.push(block);
    return "\u0000BLOCK" + (blocks.length - 1) + "\u0000";
  });
  next = normalizeText(next);

  next = next.replace(/\bcontent="([^"]*)"/g, (match, value) => {
    if (/^https?:\/\//.test(value)) return match;
    return 'content="' + normalizeText(value) + '"';
  });

  next = next.replace(/<title>([^<]*)<\/title>/g, (match, title) => {
    return "<title>" + normalizeText(title) + "</title>";
  });

  next = next.replace(/\u0000BLOCK(\d+)\u0000/g, (_, index) => blocks[Number(index)]);
  return next;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (extensions.has(path.slice(path.lastIndexOf(".")))) await normalizeFile(path);
  }
}

async function normalizeFile(path) {
  const text = await readFile(path, "utf8");
  const next = path.endsWith(".html")
    ? normalizeHtml(text)
    : normalizeText(text);
  if (next !== text) {
    await writeFile(path, next);
    console.log("Normalized", path);
  }
}

await walk(root);
