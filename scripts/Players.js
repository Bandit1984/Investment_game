const fs = require('fs');
const Scraper = require('./PlayerRunner');
const { chromium } = require('playwright');
const path = require('path');

// simple concurrency runner
async function runWithConcurrency(tasks, limit) {
    let i = 0;
    const results = [];
    async function worker() {
        while (true) {
            const idx = i++;
            if (idx >= tasks.length) return;
            try { results[idx] = await tasks[idx](); } catch (e) { results[idx] = e; }
        }
    }
    const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
    await Promise.all(workers);
    return results;
}

async function run(options = {}) {
    const CONCURRENCY = options.concurrency || 20;
    const START = options.start || 1;
    const END = options.end || 30;

    const indices = [];
    for (let i = START; i <= END; i++) indices.push(i);

    // launch single shared browser
    const browser = await chromium.launch({ headless: false, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

    const tasks = indices.map(idx => async () => {
        try {
            await Scraper(idx, browser);
        } catch (err) {
            console.error('Worker', idx, 'failed:', err && err.message ? err.message : err);
        }
    });

    await runWithConcurrency(tasks, CONCURRENCY);

    try { await browser.close(); } catch (e) { /* ignore */ }
}

module.exports = run;

