import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });

// Services top — should be pure white
await p.evaluate(() => document.getElementById("services")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 500));
await p.screenshot({ path: "/tmp/ss-white-services.png" });

// Solution / testimonials boundary
await p.evaluate(() => {
  const t = document.querySelector("#process");
  if (t) t.scrollIntoView({ block: "end" });
});
await new Promise((r) => setTimeout(r, 500));
await p.screenshot({ path: "/tmp/ss-white-fade.png" });

await b.close();
