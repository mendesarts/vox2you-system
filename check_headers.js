const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const headers = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];

console.log('Headers:', headers);
