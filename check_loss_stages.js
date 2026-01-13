const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('--- LEADS WITH LOSS REASON ---');
data.forEach(row => {
    if (row['Motivo de insucesso']) {
        console.log(`ID: ${row['ID']} | Stage: ${row['Etapa do lead']} | Reason: ${row['Motivo de insucesso']}`);
    }
});
