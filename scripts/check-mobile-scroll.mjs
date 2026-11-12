// Run against a running site: npm run test:mobile-scroll -- http://localhost:3000
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer";

const origin = new URL(process.argv[2] || "http://localhost:3000").origin;
const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const browser = await puppeteer.launch({ headless: true, executablePath, args: ["--no-sandbox"] });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const screenshotDirectory = process.env.NAV_SCROLL_SCREENSHOT_DIR;
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });

try {
  const page = await browser.newPage();
  const viewport = { width: 390, height: 844, isMobile: true, hasTouch: true };
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument(() => {
    window.scrollWrites = [];
    window.fingerDown = false;
    window.addEventListener("touchstart", () => { window.fingerDown = true; }, { passive: true });
    window.addEventListener("touchend", () => { window.fingerDown = false; }, { passive: true });
    window.addEventListener("touchcancel", () => { window.fingerDown = false; }, { passive: true });
    const scrollTo = window.scrollTo.bind(window);
    window.scrollTo = (...args) => {
      window.scrollWrites.push({ touching: window.fingerDown, y: window.scrollY, args });
      return scrollTo(...args);
    };
  });
  const input = await page.createCDPSession();
  const touch = (type, y) => input.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: type === "touchEnd" ? [] : [{ x: 180, y }],
  });
  const headerY = () => page.$eval("header", (header) =>
    new DOMMatrixReadOnly(getComputedStyle(header).transform).m42);
  async function swipe(positions) {
    await touch("touchStart", positions[0]);
    for (const y of positions.slice(1)) { await touch("touchMove", y); await wait(20); }
    await touch("touchEnd");
    await wait(500);
  }

  for (const route of ["/", "/about"]) {
    await page.setViewport(viewport);
    await page.goto(new URL(route, origin).href, { waitUntil: "networkidle2", timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await wait(1200);
    // A slow tail used to let the opposite raw-touch handler reveal the menu.
    await swipe([700, 650, 600, 550, 500, 450, 400, 350, 300, 260, 258, 256, 254, 252, 250]);
    assert.ok(await page.evaluate(() => scrollY > 250), `${route}: swipe must scroll the page`);
    assert.ok(await headerY() < -40, `${route}: header must stay hidden after a downward swipe`);
    await swipe([250, 290, 330, 370, 410, 450, 490, 530]);
    assert.ok(Math.abs(await headerY()) < 1, `${route}: upward page movement must reveal the header`);
  }

  await page.goto(origin, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  await wait(1200);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await wait(500);
  await page.evaluate(() => { window.scrollWrites = []; });
  await touch("touchStart", 700);
  for (let n = 0; n < 16; n++) {
    await touch("touchMove", 680 - n * 25);
    // Model the browser toolbar collapsing, which resizes 100dvh sections.
    if (n === 3) await page.setViewport({ ...viewport, height: 925 });
    await wait(45);
  }
  const interruptedWrites = await page.evaluate(() => window.scrollWrites.filter((call) => call.touching));
  await touch("touchEnd");
  assert.deepEqual(interruptedWrites, [], "Layout refresh must not write the scroll position during a swipe");
  await wait(1000);
  assert.ok(await page.evaluate(() => window.scrollWrites.length > 0), "Deferred layout measurement must still run after scrolling stops");
  assert.ok(await headerY() < -40, "Viewport resize must not spuriously reveal the header");
  const barVisible = await page.evaluate(() => {
    const link = document.querySelector('.fixed.bottom-0 a[href="/book"]');
    return link && getComputedStyle(link).visibility === "visible";
  });
  assert.equal(barVisible, true, "Sticky booking actions must remain available");

  if (screenshotDirectory) await page.screenshot({ path: path.join(screenshotDirectory, "scroll-fixed-mobile.png") });

  // The drawer must still lock only its background and release it on close.
  await swipe([300, 340, 380, 420, 460, 500, 540]);
  await page.click('button[aria-label="Open menu"]');
  await page.waitForFunction(() => document.querySelector('dialog[aria-label="Main menu"]')?.open);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('dialog[aria-label="Main menu"]')?.open);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(origin, { waitUntil: "networkidle2", timeout: 60000 });
  await wait(1400);
  assert.ok(Math.abs(await headerY()) < 1, "Desktop header must remain in place");
  if (screenshotDirectory) await page.screenshot({ path: path.join(screenshotDirectory, "scroll-fixed-desktop.png") });
  console.log("PASS: native touch direction, slow swipes, viewport resize during a gesture, deferred refresh, sticky actions and drawer scroll cleanup.");
} finally {
  await browser.close();
}
