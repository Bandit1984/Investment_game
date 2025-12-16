const {chromium} = require('playwright');
const fs = require('fs');

async function Scraper(workerID) {
    const browser = await chromium.launch({ headless: true }); 
    const page = await browser.newPage();

   const runData = [];

   page.on('websocket', ws => {
    ws.on('framereceived', frame => {
      const payload = frame.payload;

      // Ignore Socket.IO heartbeat frames
      if (payload === '2' || payload === '3') return;

      // Socket.IO event frame
      if (payload.startsWith('42')) {
        try {
          const parsed = JSON.parse(payload.slice(2));
          runData.push(parsed);
        } catch (e) {
          // ignore malformed frames
        }
      }
    });
  });
   


    await page.goto('https://buildyourstax.com/');

    await page.getByRole('button', { name: 'play alone' }).click();

    for(let i = 0; i < 6; i++)
    {
        await page.locator('div[role="button"]', { hasText: 'Next' }).click();
    }
    await page.getByRole('button', { name: 'ready' }).click();
    
    // savings account
    for(let i = 0; i < 2; i++)
    {
        await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    await page.waitForSelector('text=Year 1', {timeout: 180000});

    // cerificate of deposit
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for(let i = 0; i < 3; i++)
    {
        await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    await page.waitForSelector('text=Year 2', {timeout: 180000});

    // index fund   
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();

    for(let i = 0; i < 4; i++)
    {
        await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    await page.waitForSelector('text=Year 3', {timeout: 180000});

    // Individual stocks
    await page.locator('div[role="button"]', { hasText: 'Unlock' }).click();
    for(let i = 0; i < 3; i++)
    {
        await page.click('.flickity-prev-next-button.next');
    }
    await page.getByRole('button', { name: 'got it' }).click();
    

    fs.writeFileSync(
        'runs/raw/runData-' + workerID + '.json',
        JSON.stringify(runData, null, 2)
    );

    await browser.close();
}

module.exports = Scraper;