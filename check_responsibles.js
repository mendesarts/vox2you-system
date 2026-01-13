const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

const responsaveis = {};
data.forEach(row => {
    const resp = row['Lead usuário responsável'];
    if (resp) {
        responsaveis[resp] = (responsaveis[resp] || 0) + 1;
    }
});

console.log('--- RESPONSÁVEIS NO EXCEL ---');
console.log(responsaveis);
