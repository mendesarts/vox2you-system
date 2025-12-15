# Vox2you System

Sistema completo de gestão comercial e acadêmica (CRM + ERP) com Agente SDR IA.

## Estrutura
- **client/**: Frontend em React + Vite.
- **server/**: Backend API em Node.js + Express.

## Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)
- NPM

### Passos
1. **Instalar Dependências**
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

2. **Rodar o Backend**
   ```bash
   cd server
   npm run dev
   ```

3. **Rodar o Frontend**
   ```bash
   cd client
   npm run dev
   ```

4. Acesse `http://localhost:5173` no seu navegador.

## Funcionalidades
- **Dashboard**: Métricas em tempo real.
- **CRM Kanban**: Gestão visual de leads (Arrastar e Soltar).
- **Agente SDR**: Simulador de atendimento via WhatsApp com IA.
- **Admin**: Gestão de alunos e turmas.
