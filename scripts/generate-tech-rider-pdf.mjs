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

/* Brand tokens (see .cursor/skills/brand-consistency/SKILL.md) */
const C = {
  primary: "#2E4036",
  accent: "#CC5833",
  cream: "#F2F0E9",
  ink: "#1A1A1A",
  footer: "#111111",
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
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=Manrope:wght@400;500;600;700&family=Jost:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=block" rel="stylesheet">
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

  /* ---------- header ---------- */
  header {
    background: ${C.primary};
    color: ${C.paper};
    padding: 8mm 14mm 7mm;
  }
  .header-meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 7.4pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  .header-meta .right { color: rgba(255,255,255,0.72); }
  header h1 {
    font-family: "Cormorant Garamond", serif;
    font-style: italic;
    font-weight: 500;
    font-size: 24.5pt;
    line-height: 1.08;
    letter-spacing: -0.01em;
    margin-top: 5mm;
  }
  header h1 .accent-word { color: #E8A98F; }
  .header-sub {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 12mm;
    margin-top: 3.5mm;
  }
  .header-sub p {
    font-size: 9.2pt;
    line-height: 1.55;
    color: rgba(255,255,255,0.88);
    max-width: 108mm;
  }
  .header-contact {
    text-align: right;
    font-size: 8.6pt;
    line-height: 1.7;
    white-space: nowrap;
  }
  .header-contact .name { font-weight: 700; letter-spacing: 0.02em; }
  .header-rule {
    width: 16mm; height: 0.8mm;
    background: ${C.accent};
    margin-top: 3mm;
  }

  /* ---------- at a glance ---------- */
  .glance {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 5.5mm 14mm 5mm;
    gap: 0 6mm;
  }
  .glance-cell { border-left: none; }
  .glance-cell + .glance-cell { border-left: 1px solid rgba(46,64,54,0.16); padding-left: 6mm; }
  .icon-box {
    width: 26px; height: 26px;
    background: ${C.primary};
    color: ${C.paper};
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2.2mm;
  }
  .glance-cell .label { font-size: 7.2pt; color: #2E4036; margin-bottom: 1.2mm; }
  .glance-cell p { font-size: 8.2pt; line-height: 1.45; color: rgba(26,26,26,0.86); }

  /* ---------- amplification decision ---------- */
  .decision {
    background: ${C.cream};
    padding: 5.5mm 14mm 6mm;
  }
  .decision-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 3.5mm;
  }
  .decision-head h2 {
    font-family: "Cormorant Garamond", serif;
    font-style: italic;
    font-weight: 500;
    font-size: 15pt;
    letter-spacing: -0.005em;
  }
  .decision-head .label { font-size: 7.2pt; color: ${C.accent}; }
  .scenarios {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5mm;
  }
  .scenario {
    background: ${C.paper};
    border: 1px solid rgba(46,64,54,0.14);
    border-radius: 2.5mm;
    padding: 4mm 5mm 4.5mm;
  }
  .scenario-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2.8mm;
  }
  .scenario .tag { font-size: 7.2pt; color: ${C.accent}; }
  .scenario h3 {
    font-family: "The Seasons", "Cormorant Garamond", serif;
    font-weight: 400;
    font-size: 12.5pt;
    letter-spacing: 0.01em;
    color: ${C.primary};
    margin-bottom: 2mm;
  }
  .scenario p { font-size: 8.4pt; line-height: 1.5; color: rgba(26,26,26,0.86); }

  /* ---------- detail columns ---------- */
  .details {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 10mm;
    padding: 5mm 14mm 4mm;
  }
  .details h2 {
    font-family: "Cormorant Garamond", serif;
    font-style: italic;
    font-weight: 500;
    font-size: 13pt;
    color: #1A1A1A;
    padding-bottom: 2.2mm;
    border-bottom: 1px solid rgba(46,64,54,0.3);
  }
  .detail-row {
    display: grid;
    grid-template-columns: 30mm 1fr;
    gap: 4mm;
    padding: 2.4mm 0;
    border-bottom: 1px solid rgba(46,64,54,0.12);
  }
  .detail-row:last-child { border-bottom: none; }
  .detail-row .label { font-size: 7.2pt; color: ${C.primary}; padding-top: 0.6mm; line-height: 1.5; }
  .detail-row p { font-size: 8.2pt; line-height: 1.5; color: rgba(26,26,26,0.86); }

  /* ---------- footer ---------- */
  footer {
    background: ${C.footer};
    color: ${C.paper};
    padding: 5mm 14mm 5.5mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14mm;
  }
  footer .label { font-size: 7.2pt; color: #E8A98F; margin-bottom: 2mm; }
  footer .advance { font-size: 8.6pt; line-height: 1.55; color: rgba(255,255,255,0.88); max-width: 112mm; }
  .footer-contact { text-align: right; white-space: nowrap; }
  .footer-contact .name {
    font-family: "The Seasons", "Cormorant Garamond", serif;
    font-size: 12.5pt;
    letter-spacing: 0.02em;
    margin-bottom: 1.6mm;
  }
  .footer-contact .line { font-size: 8.6pt; line-height: 1.7; color: rgba(255,255,255,0.88); }
  .footer-contact .email { color: #E8A98F; font-weight: 600; }
</style>
</head>
<body>

<header>
  <div class="header-meta label">
    <span>Everything the desk needs</span>
    <span class="right mono">1 page</span>
  </div>
  <h1>Solo cello sets<br>full tech rider</h1>
  <div class="header-rule"></div>
  <div class="header-sub">
    <p>I perform solo amplified cello with backing tracks. The setup is compact and self-managed &mdash; this single page covers input, playback, monitoring and timing.</p>
    <div class="header-contact">
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
    <div class="icon-box">${icon(g.icon)}</div>
    <div class="label">${g.label}</div>
    <p>${g.detail}</p>
  </div>`
    )
    .join("\n  ")}
</section>

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
        <span style="color:${C.primary}">${icon(s.icon, 17)}</span>
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
      (col) => `<div>
    <h2>${col.heading}</h2>
    ${col.rows
      .map(
        (r) => `<div class="detail-row">
      <div class="label">${r.term}</div>
      <p>${r.detail}</p>
    </div>`
      )
      .join("\n    ")}
  </div>`
    )
    .join("\n  ")}
</section>

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
    const seasonsLoaded = document.fonts.check('12px "The Seasons"');
    return { height: document.body.scrollHeight, a4Px, seasonsLoaded };
  });
  if (fit.height > fit.a4Px + 1) {
    console.warn(`Content overflows one A4 page: ${Math.round(fit.height)}px > ${Math.round(fit.a4Px)}px`);
  }
  if (!fit.seasonsLoaded) console.warn("The Seasons font did not load.");
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
