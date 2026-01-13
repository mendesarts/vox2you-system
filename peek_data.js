const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-06.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(datasheet, { header: 1 });

    if (data.length > 1) {
        console.log('--- PRIMEIRA LINHA DE DADOS ---');
        console.log(data[1]);
    } else {
        console.log('Sem dados.');
    }
} catch (err) {
    console.error('Erro ao ler XLSX:', err.message);
}
