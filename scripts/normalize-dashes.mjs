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
const arrow = /\u2192/g;

function normalizeCompounds(text) {
  return text
    .replace(/(\d+)-day\b/gi, "$1 - day")
    .replace(/(\d+)-days\b/gi, "$1 - days")
    .replace(/(\d+)-hour\b/gi, "$1 - hour")
    .replace(/(\d+)-week\b/gi, "$1 - week")
    .replace(/(\d+)-month\b/gi, "$1 - month")
    .replace(/(\d+)-minute\b/gi, "$1 - minute")
    .replace(/(\d+)-second\b/gi, "$1 - second")
    .replace(/\bFirst-week\b/gi, "First - week")
    .replace(/\bVet-visit\b/g, "Vet - visit")
    .replace(/\bsign-up\b/gi, "sign - up")
    .replace(/\bPuppy-safe\b/gi, "Puppy - safe")
    .replace(/\bAge-appropriate\b/gi, "Age - appropriate")
    .replace(/\bEnzyme-based\b/gi, "Enzyme - based")
    .replace(/\bNon-breaking\b/gi, "Non - breaking")
    .replace(/\bwell-served\b/gi, "well - served")
    .replace(/\bhigh-speed\b/gi, "high - speed")
    .replace(/\bone-sided\b/gi, "one - sided")
    .replace(/\bday-by-day\b/gi, "day - by - day")
    .replace(/\bweek-by-week\b/gi, "week - by - week")
    .replace(/\bmonth-by-month\b/gi, "month - by - month")
    .replace(/\beight-week-old\b/gi, "eight - week - old")
    .replace(/\bwelcome-party\b/gi, "welcome - party")
    .replace(/\bcomb-width\b/gi, "comb - width")
    .replace(/\bPuppy-proofing\b/g, "Puppy - proofing")
    .replace(/\bself-injury\b/gi, "self - injury")
    .replace(/\bwrite-up\b/gi, "write - up")
    .replace(/\bside-eye\b/gi, "side - eye")
    .replace(/\bshow-off\b/gi, "show - off")
    .replace(/\bfirst-month\b/gi, "first - month");
}

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

  next = next.replace(/>([^<]+)</g, (match, inner) => {
    if (!inner.trim()) return match;
    return ">" + normalizeCompounds(inner) + "<";
  });

  next = next.replace(/\bcontent="([^"]*)"/g, (match, value) => {
    if (/^https?:\/\//.test(value)) return match;
    return 'content="' + normalizeCompounds(normalizeText(value)) + '"';
  });

  next = next.replace(/<title>([^<]*)<\/title>/g, (match, title) => {
    return "<title>" + normalizeCompounds(normalizeText(title)) + "</title>";
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
    : normalizeCompounds(normalizeText(text)).replace(/first-(\d+) - /g, "first-$1-");
  if (next !== text) {
    await writeFile(path, next);
    console.log("Normalized", path);
  }
}

await walk(root);
