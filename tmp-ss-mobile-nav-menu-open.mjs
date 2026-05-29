import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await p.screenshot({ path: "/tmp/ss-mobile-nav-closed.png" });

const btn = await p.waitForSelector('button[aria-label="Open menu"]');
await btn.click();
await new Promise((r) => setTimeout(r, 400));
await p.screenshot({ path: "/tmp/ss-mobile-nav-open.png" });

await b.close();
