const buildStocks = require('./scripts/BuildStocks');

// Default run: change concurrency/start/end as needed. This will actually launch browsers when run.
if (require.main === module) {
	const options = { concurrency: 20, start: 30, end: 50};
	buildStocks(options).catch(err => {
		console.error('BuildStocks failed:', err && err.message ? err.message : err);
		process.exit(1);
	});
}

