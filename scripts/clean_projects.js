const fs = require('fs');
const storePath = './data/crm_store.json';

try {
  if (fs.existsSync(storePath)) {
    const data = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (Array.isArray(data.projectsList)) {
      data.projectsList = data.projectsList.filter(p => 
        !p.title.includes('RESIDENTIAL') && 
        !p.title.includes('Greenfield') && 
        !p.title.includes('Metro')
      );
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
      console.log('Successfully cleaned legacy construction projects.');
    }
  }
} catch (e) {
  console.error(e);
}
