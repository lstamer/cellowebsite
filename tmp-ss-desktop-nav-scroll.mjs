import puppeteer from "puppeteer";

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });

await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await delay(500);

for (let i = 0; i < 15; i++) {
  await p.mouse.wheel({ deltaY: 200 });
  await delay(100);
}
await delay(500);
await p.screenshot({ path: "/tmp/ss-desktop-nav-scrolled.png" });

const headerY = await p.evaluate(() => {
  const header = document.querySelector("header");
  if (!header) return null;
  const style = window.getComputedStyle(header);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return matrix.m42;
});

console.log("desktop header translateY:", headerY);
await b.close();
