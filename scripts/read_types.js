const fs = require('fs');
const content = fs.readFileSync('src/lib/types.ts', 'utf8');

const vIdx = content.indexOf('export interface Vendor');
console.log('=== VENDOR ===');
console.log(content.slice(vIdx, vIdx + 600));

const tIdx = content.indexOf('export interface Task');
console.log('=== TASK ===');
console.log(content.slice(tIdx, tIdx + 600));
