# 🚀 VoxFlow System - Manual de Instalação e Execução

Bem-vindo ao sistema de gestão escolar **VoxFlow**. Este guia foi projetado para levar você do zero ao funcionamento total do sistema.

---

## 📋 Pré-requisitos
Antes de começar, verifique se você possui o ambiente preparado:

1.  **Node.js**: Versão 18 ou superior.
    *   Verifique rodando `node -v` no terminal.
    *   Se não tiver: [Baixar Node.js](https://nodejs.org)
2.  **Terminal**: Pode ser PowerShell (Windows), Terminal (Mac) ou Bash (Linux).

---

## ⚙️ Passo 1: Instalação Automática

O sistema é comporto por dois módulos: **Server** (Lógica e Banco) e **Client** (Telas).

1. Abra o terminal na pasta principal do projeto.
2. Digite os seguintes comandos, um por linha:

```bash
# Entrar na pasta do servidor e instalar dependências
cd server
npm install

# Voltar e entrar na pasta do cliente para instalar dependências
cd ../client
npm install
```

---

## 💾 Passo 2: Preparar o Banco de Dados

O sistema já vem com um banco de dados SQLite embutido, perfeito para começar sem configurações complexas.

1. No terminal, vá para a pasta do servidor:
   ```bash
   cd server
   ```
2. Execute o script de configuração inicial:
   ```bash
   node setup-db.js
   ```

✅ **Sucesso:** Você verá mensagens como `Tabelas (re)criadas com sucesso!` e `Unidades criadas`. Isso significa que o banco de dados foi limpo e populado com dados de exemplo (Unidades, Alunos, Leads, etc.).

---

## ▶️ Passo 3: Ligando os Motores

Você precisará de **duas janelas de terminal** abertas simultaneamente (ou abas).

### Terminal 1 - SERVIDOR (Backend)
Responsável por processar dados, IA e Banco de Dados.
```bash
cd server
npm run dev
```
> Aguarde aparecer: `Servidor rodando na porta 3000`

### Terminal 2 - SITE (Frontend)
Responsável por exibir as telas para você usar.
```bash
cd client
npm run dev
```
> Aguarde aparecer: `Locall: http://localhost:5173`

---

## 🖥️ Passo 4: Acessando o Sistema

Abra seu navegador (Chrome, Edge, etc.) e digite:
👉 **http://localhost:5173**

### 🔐 Logins de Acesso
O sistema já vem com usuários pré-configurados para você testar os perfis.

**1. ADMIN MASTER (Vê tudo)**
*   **Email:** `admin@voxflow.com`
*   **Senha:** `admin`

**2. CONSULTOR (Unidade Centro)**
*   **Email:** `lucas@voxflow.com`
*   **Senha:** `123`

**3. CONSULTORA (Unidade Shopping)**
*   **Email:** `sofia@voxflow.com`
*   **Senha:** `123`

---

## 🌟 Principais Funcionalidades

### 🏢 1. Multi-Unidades (Modo Franquia)
No **Dashboard Principal**, observe o topo da página à direita.
*   Existe um seletor onde você pode escolher ver dados da **Matriz**, **Filial** ou **Todas (Master)**.
*   Experimente trocar e veja os gráficos mudarem instantaneamente.

### 🤖 2. Monitoramento de IA (CRM)
Vá para a aba **Comercial (CRM)**.
*   Clique em qualquer card de Lead.
*   Você verá uma simulação de **Chat ao Vivo**.
*   Mensagens roxas são da IA (Julia), mensagens verdes são suas, e brancas são do cliente.
*   Clique no botão **"Assumir Chat"** para pausar a IA e responder manualmente.

### 💰 3. Performance da Equipe
No **Dashboard Principal**, role para "Desempenho da Equipe".
*   Você verá cards individuais para o Lucas e a Sofia.
*   Acompanhe o progresso de metas de cada um em tempo real.

---

## ❓ Solução de Problemas Comuns

**Problema:** O site não carrega ou dá erro de conexão (`Network Error`).
*   **Solução:** Verifique se o TERMINAL 1 (Servidor) está rodando e sem erros vermelhos. Se ele tiver parado, rode `npm run dev` novamente na pasta `server`.

**Problema:** "SequelizeDatabaseError" ou erros estranhos no banco.
*   **Solução:** O banco pode ter corrompido. Pare o servidor (`Ctrl+C`), e rode `node setup-db.js` na pasta `server` para resetar tudo.

---
**Advanced Agentic Coding - VoxFlow System**
*Versão 1.5 - Multi-Unit & AI Core*
