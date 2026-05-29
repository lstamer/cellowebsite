import puppeteer from "puppeteer";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "desktop", width: 1440, height: 900 },
];

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

for (const vp of viewports) {
  await page.setViewport({ width: vp.width, height: vp.height });
  await page.goto("http://localhost:3000/#about", { waitUntil: "networkidle2", timeout: 15000 });
  await page.evaluate(() => {
    const el = document.getElementById("about");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `/tmp/ss-about-${vp.name}.png` });
}

await browser.close();
