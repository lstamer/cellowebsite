import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: "new"
  });
  const page = await browser.newPage();
  
  // Set viewport to a typical desktop size
  await page.setViewport({ width: 1440, height: 1080 });

  const url = 'http://localhost:3000/design-system';
  console.log(`Navigating to ${url}...`);
  
  try {
    // Wait until network is mostly idle to ensure fonts and images are loaded
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'screenshots');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    console.log('Taking full page screenshot...');
    await page.screenshot({ 
      path: path.join(outputDir, 'design-system-full.png'),
      fullPage: true 
    });
    
    console.log('Taking desktop viewport screenshot...');
    await page.screenshot({ 
      path: path.join(outputDir, 'design-system-viewport.png'),
      fullPage: false
    });

    console.log('Screenshots saved to the /screenshots directory.');
  } catch (error) {
    console.error('Error taking screenshot:', error.message);
    console.log('Make sure your Next.js development server is running on http://localhost:3000');
  } finally {
    await browser.close();
  }
})();
