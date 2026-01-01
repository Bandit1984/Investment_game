const Players = require('./scripts/Players');

if (require.main === module) {
	const options = { concurrency: 1, start: 30000, end: 30000};
	Players(options).catch(err => {
		console.error('Operation failed:', err && err.message ? err.message : err);
		process.exit(1);
	});
}

