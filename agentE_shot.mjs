import puppeteer from "puppeteer";

const url = "http://localhost:3000/services/weddings";
const b = await puppeteer.launch({ headless: true });

async function shot(width, height, path) {
  const p = await b.newPage();
  await p.setViewport({ width, height });
  await p.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  // Scroll the pricing section into view and let GSAP reveal settle.
  await p.evaluate(() => {
    const el = document.querySelector("#pricing");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  });
  await new Promise((r) => setTimeout(r, 1400));
  // Grab the pricing section text for an assertion.
  const text = await p.evaluate(() => {
    const el = document.querySelector("#pricing");
    return el ? el.innerText : "NO_PRICING_SECTION";
  });
  await p.screenshot({ path });
  await p.close();
  return text;
}

const deskText = await shot(1440, 1600, "/tmp/agentE_desktop.png");
const mobText = await shot(375, 1800, "/tmp/agentE_mobile.png");

const numericPrice = /R\s?\d|\d{1,3},\d{3}/;
console.log("DESKTOP has numeric price:", numericPrice.test(deskText));
console.log("MOBILE has numeric price:", numericPrice.test(mobText));
console.log("Has 'Check my date':", deskText.includes("Check my date"));
console.log("---- DESKTOP PRICING TEXT ----");
console.log(deskText);

await b.close();
