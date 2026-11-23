const fs = require('fs');
const content = fs.readFileSync('src/lib/types.ts', 'utf8');

const vIdx = content.indexOf('export interface Vendor');
console.log(content.slice(vIdx - 50, vIdx + 600));
