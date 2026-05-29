import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812 });
await page.goto("http://localhost:3000/services/weddings", {
  waitUntil: "networkidle2",
  timeout: 30000,
});

await page.evaluate(() => {
  const pivot = document.querySelector(".value-pivot .h-px");
  if (pivot) pivot.scrollIntoView({ block: "center" });
});

await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: "/tmp/ss-weddings-value-mobile-mid.png" });
await browser.close();
