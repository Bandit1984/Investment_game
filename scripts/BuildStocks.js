const fs = require('fs');
const Scraper = require('./RunBuilder');

async function run() {
    const WORKERS = 10;
    const jobs = [];

    for (let i = 0; i < WORKERS; i++) {
        jobs.push(Scraper(i + 1));
    }

    await Promise.all(jobs);
}

module.exports = run;
