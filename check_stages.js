const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet);

const stages = {};
rows.forEach(r => {
    const stage = r['Etapa do lead'];
    if (stage) stages[stage] = (stages[stage] || 0) + 1;
});

console.log('Etapas encontradas:', stages);
