import puppeteer from "puppeteer";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 375, height: 812 });

await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await delay(800);

await p.screenshot({ path: "/tmp/ss-mobile-nav-top.png" });

for (let i = 0; i < 12; i++) {
  await p.mouse.wheel({ deltaY: 120 });
  await delay(120);
}
await delay(600);
await p.screenshot({ path: "/tmp/ss-mobile-nav-scrolled-down.png" });

for (let i = 0; i < 8; i++) {
  await p.mouse.wheel({ deltaY: -120 });
  await delay(120);
}
await delay(600);
await p.screenshot({ path: "/tmp/ss-mobile-nav-scrolled-up.png" });

const headerY = await p.evaluate(() => {
  const header = document.querySelector("header");
  if (!header) return null;
  const style = window.getComputedStyle(header);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return matrix.m42;
});

console.log("header translateY after scroll up:", headerY);
await b.close();
