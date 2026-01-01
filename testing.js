const dataMap = require('./dataMap.json');

console.log(dataMap.cds[121].short.interest);
console.log(dataMap.savings[121].rate);
console.log(((dataMap.fund[122].adjusted-dataMap.fund[121].adjusted)/dataMap.fund[121].adjusted)*100);