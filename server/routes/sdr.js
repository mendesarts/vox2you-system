const express = require('express');
const router = express.Router();

router.get('/download-launcher', (req, res) => {
    const batContent = `
@echo off
TITLE VoxFlow SDR - Servidor Local
COLOR 0A
CLS

ECHO ==================================================
ECHO      VOXFLOW INTELLIGENCE - INICIADOR AUTOMATICO
ECHO ==================================================
ECHO.

:: 1. Verificacao de Node.js
ECHO [1/3] Verificando ambiente...
node -v >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    ECHO [ERRO] Node.js nao encontrado!
    ECHO Por favor, instale o Node.js (LTS) em: https://nodejs.org/
    PAUSE
    EXIT
)

:: 2. Instalacao de Dependencias (Apenas se necessario)
IF NOT EXIST "node_modules" (
    ECHO [2/3] Primeira execucao detectada. Instalando sistema...
    ECHO Isso pode levar alguns minutos. Aguarde...
    call npm install
) ELSE (
    ECHO [2/3] Sistema ja instalado.
)

:: 3. Execucao
ECHO [3/3] Iniciando IA e WhatsApp...
ECHO.
ECHO IMPORTANTE: Nao feche esta janela enquanto usar o sistema.
ECHO.

npm start
PAUSE
  `;

    res.setHeader('Content-disposition', 'attachment; filename=VoxFlow_Launcher.bat');
    res.setHeader('Content-type', 'application/x-bat');
    res.write(batContent);
    res.end();
});

router.get('/download-launcher-linux', (req, res) => {
    const shContent = `#!/bin/bash
# VOXFLOW SDR - LAUNCHER LINUX
# Unidade: Brasilia - Aguas Claras

echo "=========================================="
echo "   VOXFLOW INTELLIGENCE - SERVIDOR LINUX"
echo "=========================================="
echo ""

# 1. Verificacao e Instalacao de Dependencias
if ! command -v node &> /dev/null
then
    echo "[1/3] Node.js nao encontrado. Iniciando instalacao automatica..."
    echo "⚠️  Sera necessario digitar sua senha de administrador (sudo) para instalar."
    echo ""
    
    # Comandos de Preparacao (Solicitados pelo usuario)
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl git
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "✅ Node.js instalado com sucesso!"
else
    echo "[1/3] Node.js ja esta instalado."
fi

# 2. Instalacao do Projeto
if [ ! -d "node_modules" ]; then
    echo "[2/3] Instalando bibliotecas do sistema..."
    npm install
else
    echo "[2/3] Bibliotecas ja instaladas."
fi

# 3. Execucao
echo ""
echo "[3/3] INICIANDO O ROBO SDR (ONLINE - NEON DB)..."
echo "------------------------------------------"
echo "Pressione CTRL+C para parar o servidor."
echo ""

# Configuração de Conexão (Neon Tech)
export NODE_ENV=production
export DATABASE_URL="postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?ssl=true"

# Iniciando Aplicação
npm start
`;

    res.setHeader('Content-disposition', 'attachment; filename=VoxFlow_Linux.sh');
    res.setHeader('Content-type', 'application/x-sh');
    res.write(shContent);
    res.end();
});

router.get('/download-optimizer-linux', (req, res) => {
    const shContent = `#!/bin/bash
# VOXFLOW - OTIMIZADOR DE SERVIDOR DEDICADO (LINUX)
# Versão: Peso Pena (Lubuntu/Mint)
# Execute com: sudo bash Otimizar_SDR.sh

echo "============================================="
echo "   VOXFLOW SERVER - MODO PERFORMANCE"
echo "============================================="
echo "ATENCAO: Este script remove LibreOffice, Players e servicos de impressora."
echo "Use APENAS se esta maquina for dedicada ao sistema."
echo ""
read -p "Pressione ENTER para confirmar ou CTRL+C para cancelar..."

echo ""
echo "[1/4] Removendo programas pesados desnecessarios..."
# Redireciona erros para null para nao assustar o usuario se o app nao existir
sudo apt-get remove --purge -y libreoffice* thunderbird* transmission* mpv vlc simple-scan gnome-software update-manager gnome-calendar gnome-calculator 2048-qt trojita quassel* hexchat* drawing* 2>/dev/null

echo "[2/4] Limpando residuos do sistema..."
sudo apt-get autoremove -y
sudo apt-get clean

echo "[3/4] Desativando servicos de segundo plano (Cups/Avahi)..."
sudo systemctl stop cups 2>/dev/null
sudo systemctl disable cups 2>/dev/null
sudo systemctl stop avahi-daemon 2>/dev/null
sudo systemctl disable avahi-daemon 2>/dev/null

echo "[4/4] Otimizando uso de Memoria RAM e Disco..."
# Ajusta Swappiness para 10 (Evita travar o HD)
sudo sysctl vm.swappiness=10
# Garante persistencia no reboot
if ! grep -q "vm.swappiness=10" /etc/sysctl.conf; then
  echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
fi

echo ""
echo "============================================="
echo "   OTIMIZACAO CONCLUIDA! REINICIE O PC."
echo "============================================="
`;

    res.setHeader('Content-disposition', 'attachment; filename=Otimizar_SDR.sh');
    res.setHeader('Content-type', 'application/x-sh');
    res.write(shContent);
    res.end();
});

module.exports = router;
