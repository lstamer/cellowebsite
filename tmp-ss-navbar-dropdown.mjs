import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });

const services = await p.waitForSelector('a[href="/#services"]');
await services.hover();
await new Promise((r) => setTimeout(r, 400));
await p.screenshot({ path: "/tmp/ss-navbar-services-dropdown.png" });

const about = await p.waitForSelector('a[href="/about"]');
await about.hover();
await new Promise((r) => setTimeout(r, 400));
await p.screenshot({ path: "/tmp/ss-navbar-about-dropdown.png" });

await b.close();
