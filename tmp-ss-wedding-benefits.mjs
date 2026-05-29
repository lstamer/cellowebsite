import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/services/weddings", {
  waitUntil: "networkidle2",
  timeout: 15000,
});
await p.evaluate(() => {
  const el = document.getElementById("benefits");
  if (el) el.scrollIntoView({ block: "start" });
});
await new Promise((r) => setTimeout(r, 1200));
await p.screenshot({ path: "/tmp/ss-wedding-benefits-desktop.png" });
await b.close();
