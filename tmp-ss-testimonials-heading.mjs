import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 10000 });
await p.evaluate(() => document.querySelector(".testimonials-heading")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 500));
await p.screenshot({ path: "/tmp/ss-testimonials-heading.png", clip: { x: 0, y: 0, width: 1440, height: 400 } });
await b.close();
