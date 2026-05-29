import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/services/weddings", {
  waitUntil: "networkidle2",
  timeout: 15000,
});
await p.evaluate(() => {
  const el = document.getElementById("benefits");
  if (el) el.scrollIntoView({ block: "start" });
});
await new Promise((r) => setTimeout(r, 1500));

const positions = await p.evaluate(() => {
  return Array.from(document.querySelectorAll(".benefit-card")).map((el, i) => {
    const rect = el.getBoundingClientRect();
    const classes = el.className;
    return { i, left: Math.round(rect.left), classes };
  });
});

console.log(JSON.stringify(positions, null, 2));
await b.close();
