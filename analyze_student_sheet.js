const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'fe30c88b-26c5-47a4-adc6-69d1828c066e11102422.xls');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const datasheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(datasheet, { header: 1 });

    console.log('--- PRIMEIRAS 10 LINHAS DA PLANILHA ---');
    for (let i = 0; i < Math.min(10, data.length); i++) {
        console.log(`Linha ${i}:`, data[i]);
    }

    console.log('\n--- TOTAL DE LINHAS ---');
    console.log(data.length);
} catch (err) {
    console.error('Erro ao ler XLSX:', err.message);
}
