#!/bin/bash

echo "🚀 Iniciando configuração do Sistema Vox2you..."

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js antes de continuar."
    exit 1
fi

echo "📦 Instalando dependências do Servidor (Backend)..."
cd server
npm install
cd ..

echo "🎨 Instalando dependências do Cliente (Frontend)..."
cd client
npm install
cd ..

echo "✅ Instalação concluída com sucesso!"
echo " "
echo "Para iniciar o sistema, você precisará de dois terminais:"
echo "1. No primeiro terminal (Backend): cd server && npm run dev"
echo "2. No segundo terminal (Frontend): cd client && npm run dev"
