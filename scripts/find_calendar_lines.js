const fs = require('fs');
const content = fs.readFileSync('src/app/workflow-calendar/page.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.includes('Workflow Agenda') || l.includes('Upload Proof') || l.includes('Upload Campaign & Social Media Proof') || l.includes('selectedAgendaDate') || l.includes('proofModalTask')) {
    console.log(`L${idx+1}: ${l}`);
  }
});
