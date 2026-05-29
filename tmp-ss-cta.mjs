import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 375, 812],
]) {
  const p = await b.newPage();
  await p.setViewport({ width, height });
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 30000 });
  await p.evaluate(() => {
    const el = document.getElementById("booking-cta");
    if (el) el.scrollIntoView({ block: "center" });
  });
  await new Promise((r) => setTimeout(r, 500));
  await p.screenshot({ path: `/tmp/ss-cta-${name}.png` });
  await p.close();
}

await b.close();
