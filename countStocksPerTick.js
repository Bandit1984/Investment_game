#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node countStocksPerTick.js <path-to-merged-file.json>');
    console.error('Example: node countStocksPerTick.js runs/merged/json/merged-1-1131.json');
    process.exit(2);
  }

  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let obj;
  try {
    obj = JSON.parse(content);
  } catch (err) {
    console.error('Error: Invalid JSON in', filePath);
    process.exit(1);
  }

  const runData = Array.isArray(obj.runData) ? obj.runData : Array.isArray(obj) ? obj : [];
  if (runData.length === 0) {
    console.error('Error: No runData found');
    process.exit(1);
  }

  const stockCounts = [];
  let tickCount = 0;

  for (const event of runData) {
    if (Array.isArray(event) && event[0] === 'timer-tick' && event[1] && typeof event[1] === 'object') {
      const stocks = event[1].stocks || {};
      const stockCount = Object.keys(stocks).length;
      stockCounts.push(stockCount);
      tickCount++;
    }
  }

  if (stockCounts.length === 0) {
    console.log('No timer-tick events found');
    process.exit(0);
  }

  const totalStocks = stockCounts.reduce((sum, count) => sum + count, 0);
  const averageStocks = totalStocks / stockCounts.length;

  console.log(`File: ${filePath}`);
  console.log(`Total ticks: ${tickCount}`);
  console.log(`Total stocks (summed): ${totalStocks}`);
  console.log(`Average stocks per tick: ${averageStocks.toFixed(2)}`);
  console.log(`Min stocks in a tick: ${Math.min(...stockCounts)}`);
  console.log(`Max stocks in a tick: ${Math.max(...stockCounts)}`);
}

if (require.main === module) main();
