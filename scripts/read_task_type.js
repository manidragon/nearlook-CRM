const fs = require('fs');
const content = fs.readFileSync('src/lib/types.ts', 'utf8');

const tIdx = content.indexOf('export interface Task ');
if (tIdx !== -1) {
  console.log(content.slice(tIdx, tIdx + 600));
} else {
  console.log('Task interface not found with space');
  const tIdx2 = content.indexOf('interface Task');
  console.log(content.slice(tIdx2, tIdx2 + 600));
}
