
const {chromium} = require('playwright');
const dataMap = require('../dataMap.json');
/*
 * Scraper collects one game run and writes it to runs/raw/runData-<workerID>.json
 * If a shared browser is provided (browserArg) it will create a new context/page
 * and only close the context; otherwise it will create and close its own browser.
 */
async function Scraper(workerID, browserArg) {
  const browserProvided = !!browserArg;
  const browser = browserArg || await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

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

    // default timeout
    page.setDefaultTimeout(180000);

    await page.goto('https://buildyourstax.com/');

    await page.getByRole('button', { name: 'play alone' }).click();

    for (let i = 0; i < 6; i++) {
      await page.locator('div[role="button"]', { hasText: 'Next' }).click();
    }
    await page.getByRole('button', { name: 'ready' }).click();

    ReceiveButton(page);
    fundsButton(page);

    // savings account
    for (let i = 0; i < 2; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();

    // Reinvest
    for (let i = 0; i < 2; i++) {
        while(true) {
            const value = parseFloat((await page.getByRole('heading', { name: '$' }).locator('span').nth(0).textContent()).replace(/,/g, ''));

            if(value > 0)
            {
                break;
            }
            await page.waitForTimeout(500);
        }
        await page.getByRole('button', { name: 'deposit' }).click();
        await page.getByRole('button', { name: 'Max' }).nth(1).click();
        await page.getByRole('button', { name: 'deposit' }).click();
        await page.waitForTimeout(5000);
    }

    // certificate of deposit
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for (let i = 0; i < 3; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    
    // invest in CDs
    await page.getByRole('button', { name: 'withdraw' }).click();
    await page.getByRole('button', { name: 'Max' }).first().click();
    await page.getByRole('button', { name: 'withdraw' }).click();

    await page.getByRole('button', { name: 'Buy' }).click();
    await page.getByRole('listitem').filter({ hasText: 'Months' }).locator('h6').click();
    await page.getByRole('button', { name: 'Max' }).nth(2).click();
    await page.getByRole('button', { name: 'Buy' }).click();

    // reinvest in CDs
    for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(14000);
    await page.locator('div.btn.x-sm.simple.button:has-text("Collect")').click({force: true});
    await page.getByRole('button', { name: 'Buy' }).click();
    await page.getByRole('listitem').filter({ hasText: 'Months' }).locator('h6').click();
    await page.getByRole('button', { name: 'Max' }).nth(2).click();
    await page.getByRole('button', { name: 'Buy' }).click();
    }

    // index fund
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for (let i = 0; i < 4; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();

    try {
    await page.locator('div.btn.x-sm.simple.button:has-text("Collect")').click({ force: true });
    } catch (err) {
        // ignore errors
        if (!err.message.includes('not visible') && !err.message.includes('detached')) {
            throw err;
        }
    }




    
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

} finally {
    try { if (context) await context.close(); } catch (e) { /* ignore */ }
    if (!browserProvided) {
      try { await browser.close(); } catch (e) { /* ignore */ }
    }
  }
}

const fundsButton = async (page) => {
  while (true) {
    const fundsBtn = page.locator('div.button:has-text("find funds")');
    const payBtn = page.locator('div.button:has-text("pay with pocket cash")');

    if (await fundsBtn.count() > 0) {
      await fundsBtn.first().click();
    }

    if( await payBtn.count() > 0) {
      await payBtn.first().click();
    }

    await page.waitForTimeout(1000); // check every second
  }
};

async function ReceiveButton(page) {
  const receiveLocator = page.locator('div.button:has-text("receive")');

  while (true) {
    if (await receiveLocator.count() > 0) {
      await receiveLocator.first().click();
    }
    await page.waitForTimeout(1000); // check every second
  }
}

module.exports = Scraper;