import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await p.evaluate(() => {
  const el = document.querySelector(".services-after-cards");
  if (el) el.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: "/tmp/ss-services-fade.png" });
await b.close();
