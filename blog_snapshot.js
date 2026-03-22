const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  console.log('Navigating to http://localhost:3000/blog...');
  // Wait for the dev server to be ready
  for (let i = 0; i < 15; i++) {
    try {
      await page.goto('http://localhost:3000/blog', { waitUntil: 'networkidle0' });
      break;
    } catch (e) {
      console.log('Retrying...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // wait for GSAP animation to complete
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: '/tmp/test_blog.png', fullPage: true });
  console.log('Screenshot saved to /tmp/test_blog.png');

  await browser.close();
})();
