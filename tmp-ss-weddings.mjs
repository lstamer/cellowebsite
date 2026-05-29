import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/services/weddings", {
  waitUntil: "networkidle2",
  timeout: 15000,
});
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
await new Promise((r) => setTimeout(r, 800));
await p.screenshot({ path: "/tmp/ss-weddings.png", fullPage: false });
await b.close();
