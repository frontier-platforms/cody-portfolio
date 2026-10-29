// Exports the presentation to public/downloads as PDF and PowerPoint, from the same slides the site shows.
// Usage: start the site (npm run dev or npm start), then: BASE_URL=http://localhost:3000 npm run export:deck
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import pptxgen from "pptxgenjs";

const base = process.env.BASE_URL ?? "http://localhost:3000";
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "downloads");
const name = "data-product-case-study";

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
await page.goto(`${base}/data-demos/calgary-transit/presentation/print`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

const pdf = await page.pdf({ width: "1280px", height: "720px", printBackground: true, pageRanges: "" });
await writeFile(path.join(outDir, `${name}.pdf`), pdf);

const slides = page.locator("section.print-slide");
const count = await slides.count();
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "One source of truth for a multi-tenant product";
pres.author = "Cody Chandler";

for (let i = 0; i < count; i++) {
  const el = slides.nth(i);
  const png = await el.screenshot({ type: "png" });
  const slide = pres.addSlide();
  slide.addImage({
    data: `image/png;base64,${png.toString("base64")}`,
    x: 0,
    y: 0,
    w: 10,
    h: 5.625,
    altText: `Slide ${i + 1}`,
  });
}

await pres.writeFile({ fileName: path.join(outDir, `${name}.pptx`) });
await browser.close();
console.log(`Exported ${count} slides to ${outDir}`);
