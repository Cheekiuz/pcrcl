import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const port = 8765;
const kitUrl = `http://127.0.0.1:${port}/30daysguide/kit-pdf.html`;
const guideUrl = `http://127.0.0.1:${port}/30daysguide/`;
const kitOutPath = join(root, "assets", "first-30-days-kit.pdf");
const guideOnlyPath = join(root, "assets", "30daysguide.pdf");

const pdfOptions = {
  format: "A4",
  printBackground: true,
  margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" },
};

const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: root,
  stdio: "ignore",
});

await delay(400);

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();

  async function renderPdf(url) {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.emulateMedia({ media: "print" });
    return page.pdf(pdfOptions);
  }

  const kitBytes = await renderPdf(kitUrl);
  const guideBytes = await renderPdf(guideUrl);

  const merged = await PDFDocument.create();
  const kitDoc = await PDFDocument.load(kitBytes);
  const guideDoc = await PDFDocument.load(guideBytes);

  const kitPages = await merged.copyPages(kitDoc, kitDoc.getPageIndices());
  kitPages.forEach((page) => merged.addPage(page));
  const guidePages = await merged.copyPages(guideDoc, guideDoc.getPageIndices());
  guidePages.forEach((page) => merged.addPage(page));

  const kitPdf = await merged.save();
  await writeFile(kitOutPath, kitPdf);
  await writeFile(guideOnlyPath, guideBytes);
  console.log("Wrote", kitOutPath);
  console.log("Wrote", guideOnlyPath);
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
