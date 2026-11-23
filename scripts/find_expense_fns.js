const fs = require('fs');
const content = fs.readFileSync('src/lib/dataService.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('createVendor') || l.includes('createExpense') || l.includes('getVendors') || l.includes('getExpenses') || l.includes('expensesTotal')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
