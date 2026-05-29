import puppeteer from "puppeteer";

const b = await puppeteer.launch({ headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900 });
await p.goto("http://localhost:3000/", { waitUntil: "networkidle2", timeout: 15000 });
await p.evaluate(() => {
  const headings = [...document.querySelectorAll("h2, h3")];
  const testimonial = headings.find((h) =>
    h.textContent?.toLowerCase().includes("kind word")
  );
  if (testimonial) testimonial.scrollIntoView({ block: "start" });
});
await new Promise((r) => setTimeout(r, 600));
await p.screenshot({ path: "/tmp/ss-testimonials-edge.png" });
await b.close();
