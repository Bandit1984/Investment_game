const fs = require('fs');
const path = require('path');

// Read the merged JSON file
const filePath = path.join(__dirname, 'runs/merged/json/merged-1-20291.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Create the map structure
const dataMap = {
  savings: [],
  cds: [],
  fund: [],
  bonds: [],
  crop: [],
  gold: [],
  stocks: {}
};

// Initialize stock arrays
const stockIds = new Set();

data.runData.forEach((entry) => {
  if (Array.isArray(entry) && entry.length > 0 && entry[0] === 'timer-tick' && entry[1]) {
    const tickData = entry[1];

    // Store entire savings object
    if (tickData.savings) {
      dataMap.savings.push(tickData.savings);
    }

    // Store entire cds object with all properties
    if (tickData.cds) {
      dataMap.cds.push(tickData.cds);
    }

    // Store entire fund object
    if (tickData.fund) {
      dataMap.fund.push(tickData.fund);
    }

    // Store entire bonds object
    if (tickData.bonds) {
      dataMap.bonds.push(tickData.bonds);
    }

    // Store entire crop object
    if (tickData.crop) {
      dataMap.crop.push(tickData.crop);
    }

    // Store entire gold object
    if (tickData.gold) {
      dataMap.gold.push(tickData.gold);
    }

    // Extract stocks with all their properties
    if (tickData.stocks) {
      Object.keys(tickData.stocks).forEach(stockId => {
        stockIds.add(stockId);
        if (!dataMap.stocks[stockId]) {
          dataMap.stocks[stockId] = [];
        }
        // Store entire stock data object with all properties
        dataMap.stocks[stockId].push(tickData.stocks[stockId]);
      });
    }
  }
});

// Write the map to a separate file
const outputPath = path.join(__dirname, 'dataMap.json');
fs.writeFileSync(outputPath, JSON.stringify(dataMap, null, 2));

console.log(`Data map created successfully`);
console.log(`Investment types: savings, cds, fund, bonds, crop, gold`);
console.log(`Number of unique stocks: ${Object.keys(dataMap.stocks).length}`);
console.log(`Output file: ${outputPath}`);
