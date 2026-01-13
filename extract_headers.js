const XLSX = require('xlsx');
const path = require('path');

const filePath = '/Users/mendesarts/.gemini/antigravity/scratch/vox2you-system/importado_export_leads_2026-01-07 (1).xlsx';
const workbook = XLSX.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

console.log(JSON.stringify(headers));
