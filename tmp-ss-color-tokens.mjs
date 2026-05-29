import puppeteer from "puppeteer";

const routes = [
  { path: "/", name: "home" },
  { path: "/services/weddings", name: "weddings" },
];

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();

for (const { path, name } of routes) {
  for (const [label, w, h] of [
    ["desktop", 1440, 900],
    ["mobile", 375, 812],
  ]) {
    await p.setViewport({ width: w, height: h });
    await p.goto(`http://localhost:3000${path}`, {
      waitUntil: "networkidle2",
      timeout: 15000,
    });
    await p.screenshot({ path: `/tmp/ss-${name}-${label}.png` });
  }
}

await b.close();
console.log("done");
