const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/download-setup-linux', (req, res) => {
    const REPO_URL = "https://github.com/SEU_USUARIO/VOXFLOW.git";

    const shContent = `#!/bin/bash
# VOXBOX - INSTALADOR UNIVERSAL LINUX (SERVER/MINIMAL)
# Versão: 2.0 (Com Atalho Desktop)

echo "============================================="
echo "   VOXBOX SETUP - LINUX SERVER"
echo "============================================="
echo "Este script vai solicitar sua senha de administrador (sudo)."
echo ""

# [1/6] DEPENDENCIAS DO SISTEMA
echo "[1/6] Instalando bibliotecas do sistema..."
sudo apt-get update
sudo apt-get install -y curl git build-essential wget gnupg xterm
# Dependencias do Chrome/Puppeteer
sudo apt-get install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release xdg-utils

# [2/6] NODE.JS
if ! command -v node &> /dev/null; then
    echo "[2/6] Instalando Node.js v20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# [3/6] PM2
echo "[3/6] Instalando PM2..."
sudo npm install -g pm2

# [4/6] APLICAÇÃO
echo "[4/6] Configurando o VoxFlow..."
cd ~/Desktop || cd ~
if [ ! -d "voxflow-sdr" ]; then
    git clone ${REPO_URL} voxflow-sdr
fi
cd voxflow-sdr
npm install

# [5/6] BOOT AUTOMATICO
echo "[5/6] Configurando Boot..."
pm2 start worker.js --name "VoxFlow-SDR"
pm2 save
pm2 startup | tail -n 1 | bash

# [6/6] CRIAR ATALHO NA ÁREA DE TRABALHO (NOVO!)
echo "[6/6] Criando icone 'Conectar WhatsApp'..."
DESKTOP_DIR=~/Desktop
# Verifica se pasta existe (alguns linux usam 'Área de Trabalho')
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR=~/Área\\ de\\ Trabalho
fi

cat <<EOF > "$DESKTOP_DIR/Conectar_WhatsApp.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Conectar WhatsApp
Comment=Ver QR Code e Status
Exec=x-terminal-emulator -e "pm2 monit"
Icon=phone
Terminal=false
StartupNotify=false
Categories=Application;
EOF

# Tenta garantir permissão de execução
chmod +x "$DESKTOP_DIR/Conectar_WhatsApp.desktop"

echo ""
echo "============================================="
echo "   INSTALACAO CONCLUIDA!"
echo "   Um icone 'Conectar WhatsApp' foi criado na sua Area de Trabalho."
echo "============================================="
`;

    res.setHeader('Content-disposition', 'attachment; filename=VoxBox_Setup_Linux.sh');
    res.setHeader('Content-type', 'application/x-sh');
    res.write(shContent);
    res.end();
});

router.get('/download-setup-win', (req, res) => {
    const REPO_URL = "https://github.com/SEU_USUARIO/VOXFLOW.git";

    const batContent = `
@echo off
TITLE VoxBox Setup - Windows
COLOR 0A

echo ==========================================
echo      VOXBOX SETUP - WINDOWS
echo ==========================================
echo.

:: 1. VERIFICAR NODE
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js necessario! Instale em nodejs.org
    pause
    exit
)

:: 2. INSTALAR FERRAMENTAS
echo [1/4] Instalando PM2 e Git...
call npm install -g pm2 pm2-windows-startup git

:: 3. BAIXAR
echo [2/4] Verificando projeto...
cd /d "%USERPROFILE%\\Desktop"
IF NOT EXIST "voxflow-sdr" (
    git clone ${REPO_URL} voxflow-sdr
)
cd voxflow-sdr

:: 4. INSTALAR DEPENDENCIAS
echo [3/4] Instalando bibliotecas...
call npm install

:: 5. INICIAR
echo [4/4] Iniciando servico...
call pm2-startup install
call pm2 start worker.js --name "VoxFlow-SDR"
call pm2 save

:: 6. CRIAR ATALHO (NOVO!)
echo Criando atalho na Area de Trabalho...
set "SHORTCUT=%USERPROFILE%\\Desktop\\Conectar_WhatsApp.bat"
echo @echo off > "%SHORTCUT%"
echo mode con: cols=100 lines=30 >> "%SHORTCUT%"
echo pm2 monit >> "%SHORTCUT%"

echo.
echo ==========================================
echo   SUCESSO!
echo   Clique no icone "Conectar_WhatsApp" na sua tela
echo   para ler o QR Code.
echo ==========================================
pause
`;

    res.setHeader('Content-disposition', 'attachment; filename=VoxBox_Setup_Win.bat');
    res.setHeader('Content-type', 'application/x-bat');
    res.write(batContent);
    res.end();
});

// NOVO: Baixar Guia de Instalação (PDF)
router.get('/download-guide', (req, res) => {
    // Tenta servir o PDF gerado
    const pdfPath = path.join(__dirname, '../public/Guia_Instalacao_VoxBox.pdf');

    if (fs.existsSync(pdfPath)) {
        res.download(pdfPath, 'Guia_Instalacao_VoxBox.pdf');
    } else {
        // Fallback para o MD se o PDF não existir
        const mdPath = path.join(__dirname, '../../GUIA_INSTALACAO_VOXBOX.md');
        if (fs.existsSync(mdPath)) {
            res.download(mdPath, 'Guia_Instalacao_VoxBox.md');
        } else {
            res.status(404).send('Guia não encontrado.');
        }
    }
});

module.exports = router;
