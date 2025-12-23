const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Scraper collects one game run and writes it to runs/raw/runData-<workerID>.json
 * If a shared browser is provided (browserArg) it will create a new context/page
 * and only close the context; otherwise it will create and close its own browser.
 */
async function Scraper(workerID, browserArg) {
  const browserProvided = !!browserArg;
  const browser = browserArg || await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

  // ensure we always close the context even if the run errors
  let context;
  try {
    context = await browser.newContext();
    const page = await context.newPage();

    const runData = [];

    page.on('websocket', ws => {
      try {
        ws.on('framereceived', frame => {
          const payload = frame.payload;
          // Ignore Socket.IO heartbeat frames
          if (payload === '2' || payload === '3') return;
          // Socket.IO event frame
          if (typeof payload === 'string' && payload.startsWith('42')) {
            try {
              const parsed = JSON.parse(payload.slice(2));
              runData.push(parsed);
            } catch (e) {
              // ignore malformed frames
            }
          }
        });
      } catch (e) {
        // ignore ws attach errors
      }
    });

    await page.goto('https://buildyourstax.com/');

    await page.getByRole('button', { name: 'play alone' }).click();

    for (let i = 0; i < 6; i++) {
      await page.locator('div[role="button"]', { hasText: 'Next' }).click();
    }
    await page.getByRole('button', { name: 'ready' }).click();

    // savings account
    for (let i = 0; i < 2; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    await page.waitForSelector('text=Year 1', { timeout: 180000 });

    // certificate of deposit
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for (let i = 0; i < 3; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    await page.waitForSelector('text=Year 2', { timeout: 180000 });

    // index fund
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for (let i = 0; i < 4; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    await page.waitForSelector('text=Year 3', { timeout: 180000 });

    // Individual stocks
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();
    for (let i = 0; i < 3; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();

    await page.waitForTimeout(1050000);

    const yearsText = await page.locator('h6.status.years').textContent();
    const [startYear, endYear] = yearsText.split(' - ').map(y => parseInt(y.trim()));

    const gameYears = { startYear, endYear };
    const output = { runData, gameYears };

    // ensure output directory exists
    fs.mkdirSync(path.dirname('runs/raw/runData-' + workerID + '.json'), { recursive: true });
    fs.writeFileSync('runs/raw/runData-' + workerID + '.json', JSON.stringify(output, null, 2));

  } finally {
    try { if (context) await context.close(); } catch (e) { /* ignore */ }
    if (!browserProvided) {
      try { await browser.close(); } catch (e) { /* ignore */ }
    }
  }
}

module.exports = Scraper;