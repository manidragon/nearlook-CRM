const fs = require('fs');
const content = fs.readFileSync('src/app/projects/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes("activeTab === 'EXPENSES'")) {
    console.log(`L${idx+1}: ${l}`);
  }
});
