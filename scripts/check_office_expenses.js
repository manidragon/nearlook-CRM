const fs = require('fs');
const content = fs.readFileSync('src/app/office/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('expenses') || l.includes('/api/expenses') || l.includes('Operational Expenses')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
