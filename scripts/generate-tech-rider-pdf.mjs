/**
 * Generates public/documents/stamer-cello-corporate-tech-rider.pdf
 *
 * Renders an A4 HTML template with the site's brand system (tokens + fonts)
 * via Puppeteer. Contact details and revision date come from
 * src/content/corporate-functions-tech-rider.json; the rider copy itself is
 * curated here for print hierarchy.
 *
 * Run: node scripts/generate-tech-rider-pdf.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const content = JSON.parse(
  readFileSync(path.join(root, "src/content/corporate-functions-tech-rider.json"), "utf8")
);

const seasonsFont = path.join(root, "public/fonts/the-seasons-regular.woff2");
const scrollLogo = readFileSync(path.join(root, "public/images/brand/stamer-scroll.webp"), "base64");

/* Brand tokens (see .cursor/skills/brand-consistency/SKILL.md) */
const C = {
  primary: "#2E4036",
  cream: "#F2F0E9",
  ink: "#1A1A1A",
  rose: "#FFD9D9",
  coralInk: "#B23F1E",
  paper: "#FFFFFF",
};

/* Lucide icon nodes (MIT), stroke rendering matches the site's icon treatment */
const ICONS = {
  mic: '<path d="M12 19v3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><rect x="9" y="2" width="6" height="13" rx="3"/>',
  bluetooth: '<path d="m7 7 10 10-5 5V2l5 5L7 17"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  armchair:
    '<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"/><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"/><path d="M5 18v2"/><path d="M19 18v2"/>',
  speaker:
    '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 6h.01"/><circle cx="12" cy="14" r="4"/><path d="M12 14h.01"/>',
  monitorSpeaker:
    '<path d="M5.5 20H8"/><path d="M17 9h.01"/><rect width="10" height="16" x="12" y="4" rx="2"/><path d="M8 6H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4"/><circle cx="17" cy="15" r="1"/>',
};

const icon = (name, size = 15) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const glance = [
  {
    icon: "mic",
    label: "Input",
    detail: "Clip-on instrument mic to the desk. XLR or 6.35&nbsp;mm jack, <strong>48&nbsp;V phantom power</strong>.",
  },
  {
    icon: "bluetooth",
    label: "Playback",
    detail: "Backing tracks over Bluetooth, or wired when a technician runs the desk.",
  },
  {
    icon: "clock",
    label: "Sound check",
    detail: "60&ndash;90 minutes before the first set.",
  },
  {
    icon: "armchair",
    label: "Seating",
    detail: "One armless chair. No riser required.",
  },
];

const scenarios = [
  {
    icon: "speaker",
    tag: "Rooms up to 100 guests",
    title: "I bring the speaker",
    body: "I can use my own powered speaker suited to small-medium venues. The venue provides an armless chair for me to play on.",
  },
  {
    icon: "monitorSpeaker",
    tag: "Larger rooms &amp; outdoor venues",
    title: "Venue provides the PA",
    body: "Please provide a PA suited to the space and guest count, plus a monitor so I can hear both the cello and the backing track on stage.",
  },
];

const detailColumns = [
  {
    heading: "Signal &amp; monitoring",
    rows: [
      {
        term: "Microphone",
        detail:
          "Clip-on instrument microphone to the desk via XLR or 6.35&nbsp;mm jack. Requires 48&nbsp;V phantom power &mdash; tell me in advance if it&rsquo;s unavailable and I&rsquo;ll bring my dynamic XLR backup.",
      },
      {
        term: "Playback &amp; connection",
        detail:
          "Bluetooth is preferred so volume, song choice and set length can flex as the room changes. A wired connection is fine when a sound technician is on the desk.",
      },
      {
        term: "Monitoring",
        detail:
          "I need to hear both the cello and the backing track &mdash; through the venue PA, or a dedicated monitor in large or outdoor venues.",
      },
    ],
  },
  {
    heading: "Room &amp; timing",
    rows: [
      {
        term: "Position &amp; seating",
        detail: "One armless chair at the performance position. No riser required.",
      },
      {
        term: "Power",
        detail: "One standard 220&nbsp;V outlet within reach of the performance position.",
      },
      {
        term: "Sound check",
        detail: "60&ndash;90 minutes before the first set.",
      },
      {
        term: "Attire",
        detail: "Black tie, business formal, or an agreed dress code to represent your brand.",
      },
    ],
  },
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${content.documentTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Jost:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=block" rel="stylesheet">
<style>
  @font-face {
    font-family: "The Seasons";
    src: url("file://${seasonsFont}") format("woff2");
    font-weight: 400;
    font-style: normal;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 210mm; height: 297mm; }
  body {
    font-family: "Manrope", sans-serif;
    color: ${C.ink};
    background: ${C.paper};
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }
  strong { font-weight: 700; }

  .mono { font-family: "IBM Plex Mono", monospace; }
  .label {
    font-family: "Jost", sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  header {
    background: ${C.cream};
    color: ${C.primary};
    padding: 7mm 12mm 5mm;
  }
  .header-meta, .header-body, .glance-heading, .scenario-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-meta {
    font-size: 7.5pt;
    padding-bottom: 2mm;
    border-bottom: 1px solid rgba(46,64,54,0.35);
  }
  .header-body { gap: 6mm; padding-top: 3mm; }
  header h1, .decision h2, .details h2 {
    font-family: "The Seasons", Georgia, serif;
    font-weight: 400;
    line-height: 1;
    color: ${C.primary};
  }
  header h1 { font-size: 37pt; letter-spacing: -0.025em; }
  .header-body p { max-width: 111mm; font-size: 9pt; line-height: 1.45; margin-top: 2.5mm; }
  .header-contact { text-align: right; font-size: 8pt; line-height: 1.4; }
  .header-contact .name { font-weight: 700; }
  .header-contact img {
    display: block;
    width: 30mm;
    height: 30mm;
    margin-left: auto;
  }

  .glance {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    margin: 0 12mm;
    padding: 5mm 0;
    border-bottom: 1px solid ${C.primary};
    gap: 5mm;
  }
  .glance-heading { justify-content: flex-start; gap: 2mm; margin-bottom: 1.8mm; }
  .icon-box {
    width: 25px;
    height: 25px;
    background: #000;
    color: ${C.paper};
    border-radius: 5px;
    display: grid;
    place-items: center;
  }
  .glance-cell .label { font-size: 7.2pt; }
  .glance-cell p, .scenario p, .detail-row p { font-size: 9.6pt; line-height: 1.48; }

  .requirements {
    flex: 1;
    display: grid;
    grid-template-columns: 36% 1fr;
    gap: 7mm;
    padding: 6mm 12mm;
    align-items: start;
  }
  .decision { background: ${C.rose}; padding: 5mm; }
  .decision-head { display: flex; flex-direction: column-reverse; gap: 2.5mm; }
  .decision h2 { font-size: 20pt; text-wrap: balance; }
  .decision-head .label { font-size: 7pt; color: ${C.coralInk}; }
  .scenario { margin-top: 4mm; padding-top: 4mm; border-top: 1px solid rgba(46,64,54,.45); }
  .scenario-top { gap: 2mm; color: ${C.primary}; }
  .scenario .tag { font-size: 7.3pt; }
  .scenario h3 {
    font-family: "The Seasons", Georgia, serif;
    font-weight: 400;
    color: ${C.primary};
  }
  .scenario h3 { font-size: 15pt; line-height: 1.1; margin: 2mm 0; }
  .details h2 { font-size: 18pt; margin-bottom: 1.6mm; }
  .details section + section { margin-top: 4mm; }
  .detail-row {
    display: grid;
    grid-template-columns: 27mm 1fr;
    gap: 3mm;
    padding: 2.4mm 0;
    border-top: 1px solid rgba(46,64,54,0.24);
  }
  .detail-row dt {
    font-size: 10.4pt;
    font-weight: 800;
    line-height: 1.25;
  }
  /* ---------- footer ---------- */
  footer {
    background: ${C.primary};
    color: ${C.paper};
    padding: 5mm 12mm 5.5mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14mm;
  }
  footer .label { font-size: 7.2pt; margin-bottom: 2mm; }
  footer .advance { font-size: 8.6pt; line-height: 1.55; max-width: 112mm; }
  .footer-contact { text-align: right; white-space: nowrap; }
  .footer-contact .name {
    font-family: "The Seasons", Georgia, serif;
    font-size: 12.5pt;
    letter-spacing: 0.02em;
    margin-bottom: 1.6mm;
  }
  .footer-contact .line { font-size: 8.6pt; line-height: 1.7; }
  .footer-contact .email { font-weight: 600; }
</style>
</head>
<body>

<header>
  <div class="header-meta label">
    <span>Everything the desk needs</span>
    <span class="mono">1 page</span>
  </div>
  <div class="header-body">
    <div>
      <h1>Solo cello sets<br>full tech rider</h1>
      <p>I perform solo amplified cello with backing tracks. The setup is compact and self-managed &mdash; this single page covers input, playback, monitoring and timing.</p>
    </div>
    <div class="header-contact">
      <img src="data:image/webp;base64,${scrollLogo}" alt="Stamer Cello" width="512" height="512">
      <div class="name">${content.contactName}</div>
      <div>${content.contactEmail}</div>
      <div>${content.contactPhone}</div>
    </div>
  </div>
</header>

<section class="glance">
  ${glance
    .map(
      (g) => `<div class="glance-cell">
    <div class="glance-heading">
      <span class="icon-box">${icon(g.icon)}</span>
      <div class="label">${g.label}</div>
    </div>
    <p>${g.detail}</p>
  </div>`
    )
    .join("\n  ")}
</section>

<main class="requirements">
<section class="decision">
  <div class="decision-head">
    <h2>Amplification &mdash; two setups, pick by room size</h2>
    <span class="label">Two options</span>
  </div>
  <div class="scenarios">
    ${scenarios
      .map(
        (s) => `<div class="scenario">
      <div class="scenario-top">
        <span class="tag label">${s.tag}</span>
        <span>${icon(s.icon, 17)}</span>
      </div>
      <h3>${s.title}</h3>
      <p>${s.body}</p>
    </div>`
      )
      .join("\n    ")}
  </div>
</section>

<section class="details">
  ${detailColumns
    .map(
      (col) => `<section>
    <h2>${col.heading}</h2>
    <dl>
    ${col.rows
      .map(
        (r) => `<div class="detail-row">
      <dt>${r.term}</dt>
      <dd><p>${r.detail}</p></dd>
    </div>`
      )
      .join("\n    ")}
    </dl>
  </section>`
    )
    .join("\n  ")}
</section>
</main>

<footer>
  <div>
    <div class="label">Before the day</div>
    <p class="advance">Send the venue, guest count and run sheet, and I&rsquo;ll confirm the input, playback and monitoring plan in advance.</p>
  </div>
  <div class="footer-contact">
    <div class="name">${content.contactName}</div>
    <div class="line email">${content.contactEmail}</div>
    <div class="line">${content.contactPhone}</div>
  </div>
</footer>

</body>
</html>`;

const stageDir = path.join(tmpdir(), "stamer-tech-rider");
mkdirSync(stageDir, { recursive: true });
const htmlPath = path.join(stageDir, "tech-rider.html");
writeFileSync(htmlPath, html);

const outPath = path.join(root, "public/documents/stamer-cello-corporate-tech-rider.pdf");

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluateHandle("document.fonts.ready");
  const fit = await page.evaluate(() => {
    const a4Px = (297 / 25.4) * 96;
    const required = ["Manrope", "The Seasons", "Jost", "IBM Plex Mono"];
    const loaded = new Set([...document.fonts].filter(face => face.status === "loaded")
      .map(face => face.family.replace(/["']/g, "")));
    return { height: document.body.scrollHeight, a4Px, missing: required.filter(name => !loaded.has(name)) };
  });
  if (fit.height > fit.a4Px + 1) {
    throw new Error(`Content overflows one A4 page: ${Math.round(fit.height)}px > ${Math.round(fit.a4Px)}px`);
  }
  if (fit.missing.length) throw new Error(`Rider fonts failed to load: ${fit.missing.join(", ")}`);
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`Wrote ${outPath}`);
} finally {
  await browser.close();
}
