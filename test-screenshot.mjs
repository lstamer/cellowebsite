import puppeteer from "puppeteer";

async function run() {
  const b = await puppeteer.launch({ headless: true });
  
  // Desktop
  const pDesk = await b.newPage();
  await pDesk.setViewport({ width: 1440, height: 900 });
  await pDesk.goto("http://localhost:3000/services/weddings", { waitUntil: "networkidle2", timeout: 15000 });
  await pDesk.screenshot({ path: "ss-desktop.png", fullPage: true });

  // Mobile
  const pMob = await b.newPage();
  await pMob.setViewport({ width: 375, height: 812 });
  await pMob.goto("http://localhost:3000/services/weddings", { waitUntil: "networkidle2", timeout: 15000 });
  await pMob.screenshot({ path: "ss-mobile.png", fullPage: true });

  await b.close();
}

run().catch(console.error);