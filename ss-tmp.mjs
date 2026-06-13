import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000", { waitUntil: "networkidle2", timeout: 10000 });
await p.screenshot({ path: "/tmp/ss.png" });
await b.close();
