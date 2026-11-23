const fs = require('fs');
const content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

const tIdx = content.indexOf('updateTask:');
console.log(content.slice(tIdx, tIdx + 1200));
