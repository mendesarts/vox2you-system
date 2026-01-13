const fs = require('fs');
const PDFParser = require('pdf2json');
const path = require('path');

async function dumpPdf() {
    const pdfPath = path.join(__dirname, '..', 'contas.pdf');
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', errData => {
        console.error('Error:', errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', pdfData => {
        console.log('--- PDF CONTENT START ---');
        console.log(pdfParser.getRawTextContent());
        console.log('--- PDF CONTENT END ---');
    });

    pdfParser.loadPDF(pdfPath);
}

dumpPdf();
