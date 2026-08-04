import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:3000/inbox');
  console.log('Navigated');
  
  // Wait for the floating button
  try {
      await page.waitForSelector('.floating-panel-toggle', { timeout: 10000 });
      console.log('Button found, clicking...');
      await page.click('.floating-panel-toggle');
      console.log('Clicked');
      await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
      console.log('No button found or timeout:', e.message);
  }
  
  await browser.close();
})();
