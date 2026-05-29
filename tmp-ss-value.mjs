import puppeteer from "puppeteer";

const base = "http://localhost:3000/services/weddings";

const browser = await puppeteer.launch({ headless: true });

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 375, 812],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(base, { waitUntil: "networkidle2", timeout: 30000 });
  await page.evaluate(() => {
    const el = document.getElementById("value");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: `/tmp/ss-weddings-value-${name}.png` });
  await page.close();
}

await browser.close();
