const fs = require('fs');
const content = fs.readFileSync('src/app/projects/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Cloud Costs') || l.includes('Cloud and API') || l.includes('Overall Expenses') || l.includes('expensesTotal') || l.includes('Cloud & API Expenses')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
