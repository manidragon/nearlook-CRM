const fs = require('fs');
const content = fs.readFileSync('src/lib/dataService.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('persistStore') || l.includes('loadStoreFromDisk') || l.includes('vendorsList') || l.includes('createVendor')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
