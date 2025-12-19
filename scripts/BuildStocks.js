const fs = require('fs');
const Scraper = require('./RunBuilder');

async function run() {
    const WORKERS = 15;
    const jobs = [];

    for (let i = 30; i < WORKERS+15; i++) {
        jobs.push(Scraper(i + 1));
    }

    await Promise.all(jobs);
}

module.exports = run;
