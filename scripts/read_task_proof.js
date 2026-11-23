const fs = require('fs');
const content = fs.readFileSync('src/lib/types.ts', 'utf8');

const tpIdx = content.indexOf('export interface TaskProofFile');
console.log(content.slice(tpIdx, tpIdx + 400));

const tIdx = content.indexOf('export interface Task {');
console.log(content.slice(tIdx, tIdx + 600));
