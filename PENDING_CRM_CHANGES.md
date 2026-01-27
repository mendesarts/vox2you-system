# Alterações Pendentes no CRMBoard.jsx

## ✅ Alterações Já Implementadas

1. **Linha 1915**: Texto da pergunta alterado
   - De: "Houve agendamento de reunião?"
   - Para: Condicional - "Houve matrícula?" (negociação) ou "Houve agendamento de reunião?" (outros)

2. **Linha 1922**: Label do campo de data alterado
   - De: "Data e Hora da Reunião"
   - Para: Condicional - "Data da Matrícula" (negociação) ou "Data e Hora da Reunião" (outros)

## 🔄 Alterações Pendentes (Inserir após linha 1011)

### Adicionar Lógica de Negociação no `confirmMove`

Inserir o seguinte código após a linha 1011 (após o fechamento do bloco `if (destinationId === 'connecting')`):

```javascript
        // NEGOTIATION LOGIC
        if (destinationId === 'negotiation') {
            if (moveData.outcome === 'success') {
                // Success: Check if enrolled
                if (moveData.scheduledMeeting === 'yes') {
                    // Enrolled! Move to won
                    if (!moveData.appointmentDate) {
                        alert('Por favor, informe a data da matrícula.');
                        return;
                    }
                    finalStatus = 'won';
                    finalData.notes = `Matrícula realizada! ${moveData.notes || ''}`.trim();
                } else {
                    // Not enrolled yet, stay in negotiation with next task
                    finalStatus = 'negotiation';
                    if (moveData.nextTaskDate) {
                        finalData.nextTaskDate = new Date(moveData.nextTaskDate).toISOString();
                        finalData.nextTaskType = 'Follow-up Negociação';
                    }
                }
            } else if (moveData.outcome === 'failure') {
                // Failure: Count attempts
                if (!moveData.nextTaskDate) {
                    alert('Por favor, defina a data e horário da próxima tentativa.');
                    return;
                }
                
                const leadsList = leads || [];
                const leadRef = leadsList.find(l => l.id.toString() === leadId.toString());
                
                // Get negotiation attempts
                let negotiationAttempts = [];
                if (leadRef && leadRef.negotiationAttempts) {
                    try {
                        negotiationAttempts = typeof leadRef.negotiationAttempts === 'string' 
                            ? JSON.parse(leadRef.negotiationAttempts) 
                            : leadRef.negotiationAttempts;
                    } catch (e) {
                        negotiationAttempts = [];
                    }
                }
                
                const validAttempts = Array.isArray(negotiationAttempts) 
                    ? negotiationAttempts.filter(a => a.date && a.date !== '') 
                    : [];
                const attemptCount = validAttempts.length + 1;
                
                if (attemptCount >= 5) {
                    // 5 failed attempts, close lead
                    finalStatus = 'closed';
                    finalData.notes = `Encerrado automaticamente após 5 tentativas de negociação sem sucesso. Última: ${moveData.notes || 'Sem observação'}`;
                    finalData.archived = true;
                    finalData.nextTaskDate = null;
                    finalData.nextTaskType = null;
                } else {
                    // Stay in negotiation, schedule next attempt
                    finalStatus = 'negotiation';
                    const nextTaskDateToUse = new Date(moveData.nextTaskDate);
                    finalData.nextTaskDate = nextTaskDateToUse.toISOString();
                    finalData.nextTaskType = 'Retentativa Negociação';
                    const formattedDate = nextTaskDateToUse.toLocaleString('pt-BR', { 
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                    });
                    finalData.notes = `Tentativa de negociação (${attemptCount}/5). Próxima tentativa: ${formattedDate}. ${moveData.notes || ''}`.trim();
                    finalData.incrementNegotiationAttempts = true;
                }
            }
        }
```

## 📝 Próximas Alterações Necessárias

### Modal de Agendamento - Não Compareceu

Quando o lead está em "scheduled" e marca "não compareceu", adicionar lógica para perguntar:
- "Abrir negociação ou encerrar atendimento?"
- Opção 1: Negociação → mover para `negotiation`
- Opção 2: Encerrar → mover para `closed`

Isso requer:
1. Adicionar novo estado no modal para capturar essa escolha
2. Modificar a lógica do attendance_check step
3. Atualizar o confirmMove para processar essa escolha

## 🔧 Backend - Alterações Necessárias

No arquivo `/server/routes/crm.js`, adicionar suporte para:
1. Campo `negotiationAttempts` (similar ao `attempts`)
2. Processar `incrementNegotiationAttempts` flag
3. Armazenar histórico de tentativas de negociação

## ✅ Resumo do Fluxo Implementado

### Negociação - Sucesso
- ✅ Pergunta: "Houve matrícula?"
- ✅ Se SIM → Move para `won` (Matrícula realizada)
- ✅ Se NÃO → Permanece em `negotiation` com próxima tarefa

### Negociação - Falha
- ✅ Conta tentativas (até 5)
- ✅ Após 5 tentativas → Move para `closed` automaticamente
- ✅ Antes de 5 → Permanece em `negotiation` com próxima tentativa agendada

### Agendamento - Não Compareceu
- ⏳ PENDENTE: Adicionar escolha entre negociação ou encerramento
