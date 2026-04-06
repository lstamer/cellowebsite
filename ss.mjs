import puppeteer from "puppeteer";
const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 10000 });

// Scroll to services section
await p.evaluate(() => {
  const element = document.getElementById('services');
  if (element) {
    element.scrollIntoView();
  }
});
// wait a bit for animations
await new Promise(r => setTimeout(r, 2000));

await p.screenshot({ path: "/tmp/ss.png" });
await b.close();