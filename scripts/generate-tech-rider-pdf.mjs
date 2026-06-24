import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Cable,
  Clock,
  FileCheck2,
  Plug,
  Ruler,
  Shirt,
  SlidersHorizontal,
  TimerReset,
} from "lucide-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const contentPath = path.join(projectRoot, "src/content/corporate-functions-tech-rider.json");
const outputDir = path.join(projectRoot, "public/documents");
const outputPath = path.join(outputDir, "stamer-cello-corporate-tech-rider.pdf");

const rider = JSON.parse(await fs.readFile(contentPath, "utf8"));

const iconMap = {
  Power: Plug,
  Footprint: Ruler,
  Amplification: Cable,
  "Sound check": SlidersHorizontal,
  "Load-in/out": TimerReset,
  Insurance: FileCheck2,
  Attire: Shirt,
  Integration: Clock,
};

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const iconMarkup = (term) => {
  const Icon = iconMap[term];

  if (!Icon) {
    return "";
  }

  return renderToStaticMarkup(
    createElement(Icon, {
      size: 20,
      strokeWidth: 1.8,
      color: "currentColor",
      "aria-hidden": true,
    })
  );
};

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(rider.documentTitle)}</title>
    <style>
      @page {
        size: A4;
        margin: 0;
      }

      @font-face {
        font-family: "TheSeasons";
        src: url("file://${path.join(projectRoot, "public/fonts/the-seasons-regular.ttf")}") format("truetype");
      }

      @font-face {
        font-family: "TheSeasonsItalic";
        src: url("file://${path.join(projectRoot, "public/fonts/the-seasons-light-italic.ttf")}") format("truetype");
      }

      :root {
        --cream: #f2f0e9;
        --cream-strong: #ece7dc;
        --ink: #161616;
        --ink-soft: rgba(22, 22, 22, 0.74);
        --line: rgba(22, 22, 22, 0.16);
        --accent: #cc5833;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: var(--cream);
        color: var(--ink);
      }

      .page {
        width: 210mm;
        min-height: 297mm;
        padding: 8mm;
      }

      .shell {
        min-height: 267mm;
        border: 1px solid rgba(22, 22, 22, 0.08);
        padding: 8mm 8mm 0;
        background:
          radial-gradient(circle at top right, rgba(204, 88, 51, 0.08), transparent 24%),
          linear-gradient(180deg, #f5f2ea 0%, var(--cream) 100%);
      }

      .eyebrow {
        margin: 0;
        font-size: 9pt;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--ink);
      }

      .header {
        display: grid;
        grid-template-columns: 82mm 1fr;
        gap: 7mm;
        align-items: stretch;
        margin-top: 3mm;
      }

      .hero-panel {
        display: grid;
        align-content: start;
        gap: 4mm;
        min-height: 63mm;
        padding: 6.5mm 6mm;
        background: var(--ink);
        color: var(--cream);
      }

      .hero-panel .mini-label {
        font-size: 8.5pt;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: rgba(242, 240, 233, 0.72);
      }

      h1 {
        margin: 0;
        font-family: "TheSeasonsItalic", Georgia, serif;
        font-size: 25pt;
        line-height: 0.96;
        font-weight: 300;
      }

      .subtitle {
        margin: 0;
        max-width: 58mm;
        font-size: 9.5pt;
        line-height: 1.5;
        color: rgba(242, 240, 233, 0.78);
      }

      .hero-underline {
        width: 18mm;
        height: 1px;
        background: var(--accent);
      }

      .intro-panel {
        display: grid;
        align-content: start;
        gap: 6mm;
        padding-top: 1mm;
      }

      .meta-chip {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        border: 1px solid rgba(22, 22, 22, 0.14);
        padding: 2.2mm 4mm;
        font-size: 9pt;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink);
      }

      .meta-copy {
        margin: 0;
        max-width: 74mm;
        font-size: 11pt;
        line-height: 1.45;
        color: var(--ink-soft);
      }

      .top-rule {
        height: 1px;
        margin-top: 5.5mm;
        background: var(--line);
      }

      .items-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: 7mm;
        margin-top: 4mm;
      }

      .items-column {
        display: grid;
      }

      .rider-item {
        display: grid;
        grid-template-columns: 12mm 1fr;
        gap: 4mm;
        align-items: start;
        padding: 3.6mm 0;
        border-bottom: 1px solid var(--line);
      }

      .icon-tile {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 12mm;
        height: 12mm;
        background: var(--ink);
        color: var(--cream);
      }

      .icon-tile svg {
        width: 5.6mm;
        height: 5.6mm;
      }

      h2 {
        margin: 0 0 1.4mm;
        font-family: "TheSeasonsItalic", Georgia, serif;
        font-size: 14.2pt;
        font-weight: 400;
        line-height: 1.05;
        color: var(--ink);
      }

      .rider-item p {
        margin: 0;
        font-size: 9.7pt;
        line-height: 1.46;
        color: var(--ink-soft);
      }

      .footer-band {
        display: grid;
        grid-template-columns: 18mm 1fr;
        gap: 5mm;
        align-items: stretch;
        margin-top: 5.5mm;
        background: var(--ink);
        color: var(--cream);
      }

      .footer-mark {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 5.5mm 0;
        border-right: 1px solid rgba(242, 240, 233, 0.18);
      }

      .footer-mark::before {
        content: "";
        width: 8mm;
        height: 8mm;
        border: 1px solid rgba(242, 240, 233, 0.5);
        transform: rotate(45deg);
      }

      .footer-copy {
        display: grid;
        gap: 2.2mm;
        padding: 4.8mm 6mm 5.2mm 0;
      }

      .footer-kicker {
        font-size: 8.5pt;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: var(--accent);
      }

      .footer-note {
        margin: 0;
        max-width: 118mm;
        font-size: 11pt;
        line-height: 1.4;
        color: rgba(242, 240, 233, 0.84);
      }

      .contact-row {
        display: flex;
        gap: 7mm;
        align-items: center;
        flex-wrap: wrap;
      }

      .contact-line {
        display: flex;
        align-items: baseline;
        gap: 2.5mm;
      }

      .contact-label {
        font-size: 8pt;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(242, 240, 233, 0.56);
      }

      .contact-value {
        margin: 0;
        font-size: 9.4pt;
        line-height: 1.4;
        color: var(--cream);
      }
    </style>
  </head>
  <body>
    <main class="page">
      <section class="shell">
        <p class="eyebrow">${escapeHtml(rider.sectionLabel)}</p>
        <header class="header">
          <div class="hero-panel">
            <span class="mini-label">Corporate events</span>
            <h1>${escapeHtml(rider.documentTitle)}</h1>
            <span class="hero-underline" aria-hidden="true"></span>
            <p class="subtitle">${escapeHtml(rider.documentSubtitle)}</p>
          </div>
          <div class="intro-panel">
            <span class="meta-chip">Venue / AV reference</span>
            <p class="meta-copy">${escapeHtml(rider.intro)}</p>
          </div>
        </header>

        <div class="top-rule" aria-hidden="true"></div>

        <section class="items-grid">
          <div class="items-column">
            ${rider.items.slice(0, 4).map((item) => `
              <article class="rider-item">
                <div class="icon-tile" aria-hidden="true">
                  ${iconMarkup(item.term)}
                </div>
                <div class="item-copy">
                  <h2>${escapeHtml(item.term)}</h2>
                  <p>${escapeHtml(item.detail)}</p>
                </div>
              </article>
            `).join("")}
          </div>
          <div class="items-column">
            ${rider.items.slice(4).map((item) => `
              <article class="rider-item">
                <div class="icon-tile" aria-hidden="true">
                  ${iconMarkup(item.term)}
                </div>
                <div class="item-copy">
                  <h2>${escapeHtml(item.term)}</h2>
                  <p>${escapeHtml(item.detail)}</p>
                </div>
              </article>
            `).join("")}
          </div>
        </section>

        <footer class="footer-band">
          <div class="footer-mark" aria-hidden="true"></div>
          <div class="footer-copy">
            <span class="footer-kicker">Support note</span>
            <p class="footer-note">${escapeHtml(rider.supportNote)}</p>
            <div class="contact-row">
              <div class="contact-line">
                <span class="contact-label">Contact</span>
                <span class="contact-value">${escapeHtml(rider.contactName)}</span>
              </div>
              <div class="contact-line">
                <span class="contact-label">Email</span>
                <span class="contact-value">${escapeHtml(rider.contactEmail)}</span>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  </body>
</html>`;

await fs.mkdir(outputDir, { recursive: true });

const browser = await puppeteer.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    scale: 0.9,
  });
} finally {
  await browser.close();
}

console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
