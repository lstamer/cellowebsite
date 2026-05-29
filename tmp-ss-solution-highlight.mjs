import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", {
  waitUntil: "networkidle2",
  timeout: 15000,
});
const h2 = await p.waitForSelector("#process h2", { timeout: 10000 });
await h2.evaluate((el) => el.scrollIntoView({ block: "center", inline: "center" }));
await new Promise((r) => setTimeout(r, 1800));
await h2.screenshot({ path: "/tmp/ss-solution-highlight.png" });
await b.close();
