const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // Wait for the dev server to be ready
  for (let i = 0; i < 10; i++) {
    try {
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
      break;
    } catch(e) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Scroll to testimonials section to trigger GSAP animations
  await page.evaluate(() => {
    const el = document.getElementById('testimonials');
    if (el) el.scrollIntoView();
  });

  // wait for GSAP animation to complete
  await new Promise(r => setTimeout(r, 3000));

  await page.screenshot({ path: '/tmp/test_testimonial.png', fullPage: true });

  await browser.close();
})();
