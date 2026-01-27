const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '../public/Guia_Instalacao_VoxBox.pdf');
const doc = new PDFDocument({ margin: 50 });

// Ensure public dir exists
if (!fs.existsSync(path.join(__dirname, '../public'))) {
    fs.mkdirSync(path.join(__dirname, '../public'));
}

doc.pipe(fs.createWriteStream(outputPath));

// --- STYLES ---
const COLORS = {
    primary: '#0078D7',
    secondary: '#E95420',
    text: '#333333',
    codeBg: '#F5F5F5',
    codeText: '#D63384',
    note: '#666666'
};

// Helper to draw code blocks
function drawCodeBlock(text) {
    const startX = doc.x;
    const startY = doc.y;
    const width = 500;
    const padding = 10;

    // Simple height estimation
    const lines = Math.ceil(text.length / 55);
    const estimatedHeight = Math.max(30, lines * 15 + 20);

    doc.rect(startX, startY, width, estimatedHeight).fill(COLORS.codeBg);

    doc.fillColor(COLORS.codeText)
        .font('Courier')
        .fontSize(10)
        .text(text, startX + padding, startY + padding, {
            width: width - (padding * 2),
            align: 'left'
        });

    // Reset to normal text
    doc.fillColor(COLORS.text).font('Helvetica').fontSize(12);
    doc.moveDown(1.5);
}

// --- CONTENT ---

// Title
doc.fontSize(24).font('Helvetica-Bold').fillColor(COLORS.primary).text('Guia de Instalação Rápida - VoxBox', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(14).font('Helvetica').fillColor(COLORS.text).text('Instalação do Robô WhatsApp e Servidor Local', { align: 'center' });
doc.moveDown(2);

// Intro
doc.fontSize(12).text('Este guia orienta a instalação do "motor" do WhatsApp (Worker Local) nos computadores das unidades. utilizamos scripts automatizados para facilitar o processo.', { align: 'justify' });
doc.moveDown(2);

// SECTION 1: LINUX
doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.secondary).text('1. Instalação Linux (Recomendado)');
doc.fontSize(12).font('Helvetica').fillColor(COLORS.text).text('Ideal para servidores dedicados, Raspberry Pi ou computadores Linux da recepção.');
doc.moveDown(1);

// Step 1
doc.font('Helvetica-Bold').text('Passo 1: Executar o "Script Mágico"');
doc.font('Helvetica').text('O script é um programa automático que instala tudo para você (Node.js, Dependências, Atalhos). Para acioná-lo, abra o Terminal e cole o comando abaixo:');
doc.moveDown(0.5);

// Code Block Linux
const codeLinux = "wget -O instalar.sh https://meuvoxflow.vercel.app/api/installers/download-setup-linux && chmod +x instalar.sh && ./instalar.sh";
drawCodeBlock(codeLinux);

doc.fontSize(10).fillColor(COLORS.note).text('O comando acima faz 3 coisas: (1) Baixa o script, (2) Dá permissão de execução e (3) Roda a instalação.', { oblique: true });
doc.moveDown(1.5);

// Step 2
doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text('Passo 2: Conectar');
doc.font('Helvetica').text('1. Aguarde o script finalizar (pode pedir sua senha sudo).');
doc.text('2. Ao terminar, ele criará um ícone na Área de Trabalho.');
doc.text('3. Clique duas vezes no ícone "Conectar WhatsApp" para abrir o QR Code.');
doc.moveDown(2);

// SECTION 2: WINDOWS
doc.fontSize(18).font('Helvetica-Bold').fillColor(COLORS.primary).text('2. Instalação Windows');
doc.fontSize(12).font('Helvetica').fillColor(COLORS.text).text('Ideal para rodar no computador da recepção ou administrativo.');
doc.moveDown(1);

// Step 1
doc.font('Helvetica-Bold').text('Passo 1: Baixar o Script (.bat)');
doc.font('Helvetica').text('O arquivo .bat é o script automático para Windows. Ele verifica se você tem o Node.js e instala se necessário.');
doc.moveDown(0.5);
drawCodeBlock("https://meuvoxflow.vercel.app/api/installers/download-setup-win");

// Step 2
doc.font('Helvetica-Bold').text('Passo 2: Executar');
doc.font('Helvetica').text('1. Vá até a pasta Downloads.');
doc.text('2. Clique com botão direito no arquivo VoxBox_Setup_Win.bat e escolha "Executar como Administrador".');
doc.text('3. Uma tela preta aparecerá e fará toda a configuração sozinha.');
doc.moveDown(1);

// Step 3
doc.font('Helvetica-Bold').text('Passo 3: Conectar');
doc.font('Helvetica').text('Ao terminar, procure o atalho "Conectar_WhatsApp" na Área de Trabalho e clique para ver o QR Code.');
doc.moveDown(2);

// SECTION 3: TROUBLESHOOTING
if (doc.y > 600) doc.addPage();

doc.fontSize(18).font('Helvetica-Bold').fillColor('#DC3545').text('Solução de Problemas');
doc.moveDown(1);

doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.text).text('Para que serve o "Script"?');
doc.font('Helvetica').text('O script é o instalador inteligente. Sem ele, você teria que digitar uns 50 comandos manuais para configurar o servidor. O script faz isso em segundos.');
doc.moveDown(1);

doc.font('Helvetica-Bold').text('Ícone não abre nada (Linux):');
doc.font('Helvetica').text('Clique com botão direito no ícone > "Permitir Lançamento" (Allow Launching).');
doc.moveDown(1);

doc.font('Helvetica-Bold').text('QR Code não aparece (Windows):');
doc.font('Helvetica').text('Verifique se não há outro programa usando a porta 3000. Reinicie o computador.');

// Footer
doc.moveDown(4);
doc.fontSize(10).fillColor('#999999').text('Gerado automaticamente pelo Sistema VoxFlow', { align: 'center' });

doc.end();
console.log('PDF gerado com sucesso em: ' + outputPath);
