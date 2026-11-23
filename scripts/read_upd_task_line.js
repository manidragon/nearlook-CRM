const fs = require('fs');
const content = fs.readFileSync('src/lib/dataService.ts', 'utf8');

const tIdx = content.indexOf('updateTask: (taskId: string');
console.log(content.slice(tIdx - 50, tIdx + 300));
