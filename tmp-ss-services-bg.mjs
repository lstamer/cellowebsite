import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 375, 812],
]) {
  await p.setViewport({ width, height });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
  await p.evaluate(() => {
    const el = document.getElementById("services");
    if (el) el.scrollIntoView({ block: "start" });
  });
  await new Promise((r) => setTimeout(r, 600));
  await p.screenshot({ path: `/tmp/ss-services-${name}.png` });
}

await b.close();
