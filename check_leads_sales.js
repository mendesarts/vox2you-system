const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

let saleCount = 0;
data.forEach(row => {
    if (row['Venda'] && row['Venda'] > 0) {
        saleCount++;
    }
});
console.log(`Leads with Sale Value: ${saleCount}`);
