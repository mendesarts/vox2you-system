const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/download-setup-linux', (req, res) => {
    const REPO_URL = "https://github.com/SEU_USUARIO/VOXFLOW.git";

    const shContent = `#!/bin/bash
# VOXBOX - INSTALADOR UNIVERSAL LINUX (LUBUNTU/UBUNTU/DEBIAN)
# Versão: 3.0 (Chromium Dedicado + PM2)

# Cores para facilitar leitura
GREEN='\\033[0;32m'
CYAN='\\033[0;36m'
RED='\\033[0;31m'
NC='\\033[0m' # No Color

echo -e "\${CYAN}============================================="
echo -e "   🚀 VOXBOX SETUP - SERVIDOR LINUX"
echo -e "=============================================\${NC}"
echo "Este script vai solicitar sua senha de admin (sudo) para instalar os programas."
echo ""

# [1/7] ATUALIZAR SISTEMA
echo -e "\${GREEN}[1/7] Atualizando sistema e repositórios...\${NC}"
sudo apt-get update -y
sudo apt-get upgrade -y

# [2/7] INSTALAR DEPENDÊNCIAS ESSENCIAIS
echo -e "\${GREEN}[2/7] Instalando ferramentas base (Git, Curl, Wget)...\${NC}"
sudo apt-get install -y curl git build-essential wget gnupg unzip xterm

# [3/7] INSTALAR CHROMIUM (NAVEGADOR PARA WHATSAPP)
# Importante para Lubuntu/Debian evitar erro de 'Sandbox'
echo -e "\${GREEN}[3/7] Instalando Chromium e dependências gráficas...\${NC}"
sudo apt-get install -y chromium-browser libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libpangocairo-1.0-0

# [4/7] INSTALAR NODE.JS (VERSÃO 20)
if ! command -v node &> /dev/null; then
    echo -e "\${GREEN}[4/7] Instalando Node.js v20...\${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "\${CYAN}✅ Node.js já instalado: $(node -v)\${NC}"
fi

# [5/7] BAIXAR SISTEMA
echo -e "\${GREEN}[5/7] Preparando pasta do projeto...\${NC}"
cd ~/Desktop || cd ~
DIR_NAME="voxflow-whatsapp"

# Verifica se a pasta existe
if [ -d "$DIR_NAME" ]; then
    echo "Pasta encontrada. Atualizando código..."
    cd $DIR_NAME
    git pull
else
    echo "Clonando repositório..."
    # Se a url não estiver definida, usa a padrão ou pede input
    git clone ${REPO_URL} $DIR_NAME || {
        echo -e "\${RED}⚠️ Falha ao clonar. Verifique se o GitHub está acessível.\${NC}"
        # Fallback: Tentar criar pasta e iniciar sem clone se for deploy local zipado
        mkdir -p $DIR_NAME
    }
    cd $DIR_NAME
fi

# [6/7] INSTALAÇÃO E CONFIGURAÇÃO
echo -e "\${GREEN}[6/7] Instalando pacotes do projeto...\${NC}"
if [ -f "package.json" ]; then
    npm install
else
    echo -e "\${RED}❌ package.json não encontrado. Certifique-se de que o código está na pasta.\${NC}"
fi

# Configurar Variáveis de Ambiente para o Puppeteer usar o Chromium do sistema
echo -e "\${CYAN}Configurando caminho do Chromium...\${NC}"
CHROMIUM_PATH=$(which chromium-browser) || $(which chromium)
echo "PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH" > .env
echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> .env

echo "✅ Arquivo .env criado com caminho: $CHROMIUM_PATH"

# [7/7] INICIAR SERVIÇO (PM2)
echo -e "\${GREEN}[7/7] Iniciando gerenciador de processos (PM2)...\${NC}"
sudo npm install -g pm2

# Remove processo antigo se existir
pm2 delete "VoxWhatsApp" 2>/dev/null || true

# Inicia com as variáveis carregadas
# Tenta startar index.js ou worker.js
if [ -f "worker.js" ]; then
    START_FILE="worker.js"
else
    START_FILE="index.js"
fi

echo "Iniciando $START_FILE..."
pm2 start $START_FILE --name "VoxWhatsApp" --node-args="--max-old-space-size=1024"

pm2 save
pm2 startup | tail -n 1 | bash

# [EXTRA] ATALHO NA ÁREA DE TRABALHO
echo -e "\${GREEN}[EXTRA] Criando atalho 'Abrir Monitor'...\${NC}"
DESKTOP_DIR=~/Desktop
if [ ! -d "$DESKTOP_DIR" ]; then
    DESKTOP_DIR=~/Área\\ de\\ Trabalho
fi

if [ -d "$DESKTOP_DIR" ]; then
    cat <<EOF > "$DESKTOP_DIR/Monitor_WhatsApp.desktop"
[Desktop Entry]
Version=1.0
Type=Application
Name=Monitor WhatsApp
Comment=Ver QR Code e Status
Exec=x-terminal-emulator -e "pm2 monit"
Icon=utilities-terminal
Terminal=false
StartupNotify=false
Categories=Application;
EOF
    chmod +x "$DESKTOP_DIR/Monitor_WhatsApp.desktop"
fi

echo ""
echo -e "\${CYAN}=============================================\${NC}"
echo -e "\${GREEN}   INSTALAÇÃO CONCLUÍDA COM SUCESSO! \${NC}"
echo -e "\${CYAN}=============================================\${NC}"
echo "1. O serviço já está rodando em segundo plano."
echo "2. Para ver o QR CODE, abra o atalho 'Monitor WhatsApp' ou digite 'pm2 monit' no terminal."
echo "3. Se precisar reiniciar, use: pm2 restart VoxWhatsApp"
echo ""
sleep 2
pm2 monit
`;

    res.setHeader('Content-disposition', 'attachment; filename=VoxBox_Setup_Linux_v3.sh');
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
