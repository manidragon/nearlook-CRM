const fs = require('fs');
const content = fs.readFileSync('src/lib/types.ts', 'utf8');

function findType(name) {
  const idx = content.indexOf(`interface ${name}`);
  if (idx !== -1) {
    console.log(content.slice(idx, idx + 800));
  }
}
console.log('=== VENDOR TYPE ===');
findType('Vendor');

console.log('=== PROJECT TYPE ===');
findType('Project');

console.log('=== EXPENSE TYPE ===');
findType('Expense');
