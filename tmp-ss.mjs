import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await p.evaluate(() => {
  document.querySelector('[aria-label="Show previous About image"]')?.scrollIntoView({ block: "center" });
});
await p.waitForSelector('[aria-label="Show previous About image"]');
const btn = await p.$('[aria-label="Show previous About image"]');
const box = await btn.boundingBox();
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await new Promise((r) => setTimeout(r, 300));
await p.screenshot({ path: "/tmp/ss.png" });
await b.close();
