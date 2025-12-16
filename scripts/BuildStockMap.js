const fs = require('fs');
const Scraper = require('./MapBuilder');

async function run() {
    const WORKERS = 10;
    const jobs = [];

    for (let i = 0; i < WORKERS; i++) {
        jobs.push(Scraper(i + 1));
    }

    await Promise.all(jobs);

    // merge results
    const mergedStockMap = {};

    for (let i = 0; i < WORKERS; i++) {
        const file = `stockMap-${i + 1}.json`;

        if (!fs.existsSync(file)) continue;

        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        Object.assign(mergedStockMap, data);
    }

    fs.writeFileSync(
        'stockMap.json',
        JSON.stringify(mergedStockMap, null, 2)
    );

    console.log(`Merged ${Object.keys(mergedStockMap).length} stocks`);
}

run();
