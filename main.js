const buildStocks = require('./scripts/BuildStocks');

// Default run: change concurrency/start/end as needed. This will actually launch browsers when run.
if (require.main === module) {
	const options = { concurrency: 40, start: 1692, end: 2772};
	buildStocks(options).catch(err => {
		console.error('BuildStocks failed:', err && err.message ? err.message : err);
		process.exit(1);
	});
}

