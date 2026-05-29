import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/about#why-me", {
  waitUntil: "networkidle2",
  timeout: 15000,
});
await p.waitForSelector("#why-me", { timeout: 10000 });
await new Promise((r) => setTimeout(r, 2500));
await p.screenshot({ path: "/tmp/ss-about-why-me.png" });
await b.close();
