import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });

for (const [name, url, viewport] of [
  ["weddings-desktop", "http://localhost:3000/services/weddings#faq", { width: 1440, height: 900 }],
  ["about-desktop", "http://localhost:3000/about#faq", { width: 1440, height: 900 }],
]) {
  const p = await b.newPage();
  await p.setViewport(viewport);
  await p.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
  await p.waitForSelector("#faq button", { timeout: 10000 });
  const el = await p.$("#faq");
  if (el) {
    await el.screenshot({ path: `/tmp/${name}-faq.png` });
  }
  await p.close();
}

await b.close();
console.log("done");
