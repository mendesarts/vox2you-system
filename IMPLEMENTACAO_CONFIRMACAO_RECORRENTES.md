# Implementação: Confirmação de Ações em Lançamentos Recorrentes/Parcelados

## 📋 Objetivo
Adicionar confirmação ao editar ou excluir contas a pagar/receber que sejam parceladas ou recorrentes, permitindo que o usuário escolha entre afetar apenas a parcela atual ou todas as parcelas futuras.

## ✅ Alterações Implementadas

### 1. Frontend - Novo Modal de Confirmação
**Arquivo:** `client/src/pages/administrative/components/RecurringActionModal.jsx`

- Modal que exibe duas opções:
  - **Apenas esta parcela**: Afeta somente o lançamento atual
  - **Todas as parcelas futuras**: Afeta este lançamento e todos os futuros do mesmo plano

- Funciona para:
  - Lançamentos parcelados (installments > 1)
  - Lançamentos recorrentes (launchType === 'recorrente')

### 2. Frontend - FinancialManager.jsx
**Alterações:**

1. **Import do novo modal**
2. **Novos estados:**
   - `showRecurringModal`: controla exibição do modal
   - `recurringAction`: tipo de ação ('edit' ou 'delete')
   - `recordForRecurringAction`: registro sendo editado/excluído

3. **Função `handleCreateRecord` modificada:**
   - Verifica se o registro é recorrente/parcelado antes de editar
   - Se sim, mostra o modal de confirmação
   - Aceita parâmetro `updateScope` ('current' ou 'all')

4. **Função `handleActionClick` (excluir) modificada:**
   - Verifica se o registro é recorrente/parcelado
   - Se sim, mostra o modal de confirmação

5. **Função `handleConfirmDelete` modificada:**
   - Aceita parâmetro `deleteScope` ('current' ou 'all')
   - Envia para o backend via query parameter

6. **Nova função `handleRecurringActionConfirm`:**
   - Processa a escolha do usuário no modal
   - Direciona para edição ou exclusão conforme a ação

### 3. Backend - financial.js
**Alterações:**

1. **Rota DELETE (`/:id`):**
   - Alterado de `deleteFutures` para `deleteScope`
   - `deleteScope='all'`: exclui este e todos os futuros do mesmo planId
   - `deleteScope='current'` (ou ausente): exclui apenas este registro

2. **Rota PUT (`/:id`):**
   - Alterado de `updatePlan` para `updateScope`
   - `updateScope='all'`: atualiza este e todos os futuros do mesmo planId
   - `updateScope='current'` (ou ausente): atualiza apenas este registro

## 🎯 Fluxo de Uso

### Edição:
1. Usuário clica em "Editar" em um lançamento parcelado/recorrente
2. Sistema abre o modal de edição
3. Usuário faz as alterações e clica em "Salvar"
4. Sistema detecta que é parcelado/recorrente
5. Exibe modal perguntando: "Apenas esta parcela" ou "Todas as futuras"
6. Usuário escolhe e confirma
7. Sistema aplica a edição conforme escolha

### Exclusão:
1. Usuário seleciona um lançamento parcelado/recorrente
2. Clica em "Excluir"
3. Sistema detecta que é parcelado/recorrente
4. Exibe modal perguntando: "Apenas esta parcela" ou "Todas as futuras"
5. Usuário escolhe e confirma
6. Sistema exclui conforme escolha

## 🔍 Detecção de Lançamentos Recorrentes/Parcelados

O sistema verifica:
- `record.launchType === 'recorrente'`: lançamento recorrente
- `record.installments > 1`: lançamento parcelado

## 📝 Notas Técnicas

- O modal só aparece para lançamentos únicos (não para seleção múltipla)
- A lógica de "todas as futuras" usa o campo `planId` para identificar registros relacionados
- Apenas registros com `dueDate >= record.dueDate` são afetados (não altera parcelas passadas)
- O backend já tinha lógica similar, foi apenas padronizado o nome dos parâmetros
