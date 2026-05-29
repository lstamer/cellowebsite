import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/services/weddings", {
  waitUntil: "networkidle2",
  timeout: 15000,
});
const text = await p.evaluate(() => document.body.innerText);
console.log(
  "Has authority section:",
  text.includes("Hear what") || text.includes("Trusted by couples")
);
console.log(
  "Has FAQ:",
  text.includes("Common questions")
);
await p.evaluate(() => {
  const el = Array.from(document.querySelectorAll("h2, h3, p")).find((n) =>
    n.textContent?.includes("Common questions")
  );
  if (el) el.scrollIntoView({ block: "center" });
});
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: "/tmp/ss-weddings-faq.png" });
await b.close();
