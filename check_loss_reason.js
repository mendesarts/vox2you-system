const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const lossReasons = {};
let count = 0;

data.forEach(row => {
    const reason = row['Motivo de insucesso'];
    if (reason) {
        lossReasons[reason] = (lossReasons[reason] || 0) + 1;
        count++;
    }
});

console.log(`Total leads with Loss Reason: ${count}`);
console.log('Reasons:', lossReasons);
