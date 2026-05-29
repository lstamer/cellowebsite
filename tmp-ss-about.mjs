import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/about", {
  waitUntil: "networkidle2",
  timeout: 15000,
});

for (const [id, name] of [
  ["achievements", "about-achievements-desktop"],
  ["faq", "about-faq-desktop"],
]) {
  await p.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ block: "center" });
  }, id);
  await new Promise((r) => setTimeout(r, 800));
  await p.screenshot({ path: `/tmp/${name}.png` });
}

await b.close();
