import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await p.screenshot({ path: "/tmp/ss-scroll-home-desktop.png" });
await p.setViewport({ width: 375, height: 812 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await p.screenshot({ path: "/tmp/ss-scroll-home-mobile.png" });
await b.close();
