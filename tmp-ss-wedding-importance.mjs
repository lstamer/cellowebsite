import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });

for (const [name, width, height] of [
  ["desktop", 1440, 900],
  ["mobile", 375, 812],
]) {
  const p = await b.newPage();
  await p.setViewport({ width, height });
  await p.goto("http://localhost:3000/services/weddings#importance", {
    waitUntil: "networkidle2",
    timeout: 20000,
  });
  await p.waitForSelector(".wedding-importance-image");
  const el = await p.$(".wedding-importance-image");
  if (el) {
    await el.evaluate((node) =>
      node.scrollIntoView({ block: "center", behavior: "instant" })
    );
  }
  await new Promise((r) => setTimeout(r, 1000));
  await p.screenshot({ path: `/tmp/ss-wedding-importance-${name}.png` });
  await p.close();
}

await b.close();
console.log("done");
