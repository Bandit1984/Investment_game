
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
  let dayTradingEnabled = false;
  
  try {
    context = await browser.newContext();
    const page = await context.newPage();

    page.on('websocket', ws => {
      try {
        console.log('websocket opened');
        ws.on('framereceived', frame => {
          const payload = frame.payload;
          try {
            if (typeof payload === 'string') {
              console.log('frame payload snippet:', payload.slice(0, 120));
            } else {
              console.log('frame payload: <binary>');
            }
          } catch (e) {
            // ignore logging errors
          }
          // Ignore Socket.IO heartbeat frames
          if (payload === '2' || payload === '3') return;
          // Socket.IO event frame
          if (typeof payload === 'string' && payload.startsWith('42')) {
            try {
              const parsed = JSON.parse(payload.slice(2));

              if (dayTradingEnabled && Array.isArray(parsed) && parsed[0] === 'timer-tick' && parsed[1]) {
                const tickData = parsed[1];
                const currentTick = tickData.tick;
                const stocks = tickData.stocks;               
                const stockIds = Object.keys(stocks).sort((a, b) => parseInt(a) - parseInt(b));
              
                let maxDiff = -Infinity;
                let maxID = null;
                
                stockIds.forEach(ID => {
                    const currValue = dataMap.stocks[parseInt(ID)].adjusted;
                    const newValue = dataMap.stocks[parseInt(ID)+1].adjusted;
                    const diff = difference(currValue, newValue);
                    if (diff > maxDiff) {
                        maxDiff = diff;
                        maxID = ID;
                    }
                });

                console.log(`Tick ${currentTick}: Buying stock ID ${maxID} with max increase of ${maxDiff.toFixed(2)}%`);

                
              }
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
    await page.waitForTimeout(14500);
    await page.locator('div.btn.x-sm.simple.button:has-text("Collect")').click({force: true});
    await page.getByRole('button', { name: 'Buy' }).click();
    await page.getByRole('listitem').filter({ hasText: 'Months' }).locator('h6').click();
    await page.getByRole('button', { name: 'Max' }).nth(2).click();
    await page.getByRole('button', { name: 'Buy' }).click();
    }

    await page.waitForTimeout(14000);
    await page.locator('div.btn.x-sm.simple.button:has-text("Collect")').click({force: true});

    // index fund
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for (let i = 0; i < 4; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();

        try {
            await page.getByRole('button', { name: 'Buy', exact: true }).click();
            await page.getByRole('listitem').filter({ hasText: 'Months' }).locator('h6').click();
            await page.getByRole('button', { name: 'Max' }).nth(2).click();
            await page.getByRole('button', { name: 'Buy', exact: true }).click();
        }
        catch (err) {
            // ignore errors
            if (!err.message.includes('not visible') && !err.message.includes('detached')) {
                throw err;
            }
        }
        
        await page.waitForTimeout(15000);
     for (let i = 0; i < 3; i++) {
        try {
        await page.locator('div.btn.x-sm.simple.button:has-text("Collect")').first().click({force: true});
        await page.getByRole('button', { name: 'Buy', exact: true }).click();
        await page.getByRole('listitem').filter({ hasText: 'Months' }).locator('h6').click();
        await page.getByRole('button', { name: 'Max' }).nth(2).click();
        await page.waitForTimeout(1000);
        await page.getByRole('button', { name: 'Buy', exact: true }).click();
        
        if(i < 2){await page.waitForTimeout(15000);}
        
        }
        catch (err) {
            // ignore errors
            if (!err.message.includes('not visible') && !err.message.includes('detached')) {
                throw err;
            }
        }
    }

    await page.locator('div.btn.x-sm.simple.button:has-text("Collect")').click({force: true});
    
    // Individual stocks
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();
    for (let i = 0; i < 3; i++) {
      await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();

                // day trading function
    dayTradingEnabled = true;
    console.log('dayTradingEnabled = true');

    // Keep the Scraper function alive so websocket handlers aren't closed by the finally block.
    // Replace this with a proper shutdown signal if you want a graceful stop later.
    await new Promise(() => {});

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

async function difference(currValue, newValue) {
    return ((newValue - currValue) / currValue) * 100;
}

module.exports = Scraper;