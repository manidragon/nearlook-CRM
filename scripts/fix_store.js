const fs = require('fs');
const path = require('path');

const storePath = path.join(__dirname, '..', 'data', 'crm_store.json');
let content = fs.readFileSync(storePath, 'utf8');
content = content.replaceAll('Arun - RESIDENTIAL INTERIOR', 'Arun - AI Automation & Enterprise Web Platform');
fs.writeFileSync(storePath, content, 'utf8');
console.log('Successfully updated storePath:', storePath);
