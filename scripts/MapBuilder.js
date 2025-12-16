const {chromium} = require('playwright');
const fs = require('fs');

async function Scraper(workerID) {
    const browser = await chromium.launch({ headless: true }); 
    const page = await browser.newPage();

    let stockMap = JSON.parse(fs.readFileSync('stockMap.json', 'utf8'));

    page.on('response', async (response) => {
        const url = response.url();

        if (url.includes('/wp-json/dev-api/v1/create-game')) {
        const json = await response.json();

        const stocks = json.config.stocks;

        for (const [id, stock] of Object.entries(stocks)) {
            if (!stockMap[id]) {
                stockMap[id] = stock.title; // real company name
            }
        }
    }
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
    `runs/stockMaps/stockMap-${workerID}.json`,
    JSON.stringify(stockMap, null, 2)
    );

    await browser.close();
}

module.exports = Scraper;