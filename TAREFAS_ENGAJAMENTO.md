# Sistema de Tarefas de Engajamento de Alunos

## 📋 Objetivo
Gerar automaticamente tarefas para o administrativo enviar mensagens de engajamento para os alunos em todos os dias de aula.

## 🎯 Funcionalidades

### O que o sistema faz:
1. **Identifica aulas do dia** - Busca todas as aulas agendadas para hoje
2. **Lista os alunos** - Para cada aula, lista todos os alunos matriculados ativos
3. **Cria tarefa administrativa** - Gera uma tarefa com:
   - Título: "Engajamento - [Nome da Turma] - Aula [Número]"
   - Lista completa de alunos com telefones
   - Horário e local da aula
   - Sugestão de mensagem de engajamento
   - Prazo: 8h da manhã do dia da aula
   - Prioridade: Alta
   - Categoria: Administrativa

### Exemplo de Tarefa Gerada:
```
Título: Engajamento - Inglês Intermediário - Aula 5

Descrição:
📱 Enviar mensagem de engajamento para os alunos da turma Inglês Intermediário

🕐 Horário da aula: 14:00
📍 Local: Sala 3

👥 Alunos (15):
- João Silva (11 98765-4321)
- Maria Santos (11 98765-4322)
- Pedro Oliveira (11 98765-4323)
...

💬 Sugestão de mensagem:
"Bom dia! 🌟 Hoje temos aula de Inglês Intermediário às 14:00. 
Estamos ansiosos para ver você! Não esqueça de trazer seu material. 
Até logo! 📚"
```

## 🚀 Como Usar

### Opção 1: Executar Manualmente via Script
```bash
cd server
node generate_engagement_tasks.js
```

### Opção 2: Executar via API
```bash
POST /api/tasks/generate-engagement
Headers: Authorization: Bearer [token]
```

### Opção 3: Agendar Execução Automática Diária

#### No macOS/Linux (usando cron):
```bash
# Editar crontab
crontab -e

# Adicionar linha para executar todo dia às 6h da manhã:
0 6 * * * cd /caminho/para/vox2you-system/server && node generate_engagement_tasks.js >> /tmp/engagement-tasks.log 2>&1
```

#### No Windows (usando Task Scheduler):
1. Abrir "Agendador de Tarefas"
2. Criar Nova Tarefa
3. Gatilho: Diariamente às 6:00
4. Ação: Executar programa
   - Programa: `node`
   - Argumentos: `generate_engagement_tasks.js`
   - Iniciar em: `C:\caminho\para\vox2you-system\server`

#### Usando PM2 (Recomendado para produção):
```bash
# Instalar pm2
npm install -g pm2

# Criar arquivo de configuração ecosystem.config.js
module.exports = {
  apps: [{
    name: 'engagement-tasks',
    script: 'generate_engagement_tasks.js',
    cron_restart: '0 6 * * *',  // Todo dia às 6h
    autorestart: false
  }]
};

# Iniciar
pm2 start ecosystem.config.js
pm2 save
```

## 📊 Logs e Monitoramento

O sistema gera logs detalhados:
- ✅ Número de aulas encontradas
- ✅ Número de tarefas criadas
- ✅ Detalhes de cada tarefa

Exemplo de saída:
```
🎯 Gerando tarefas de engajamento de alunos...
📅 Encontradas 8 aulas para hoje
  ✅ Tarefa criada: Engajamento - Inglês Básico - Aula 3
  ✅ Tarefa criada: Engajamento - Espanhol Intermediário - Aula 7
  ...
✨ 8 tarefas de engajamento criadas com sucesso!
```

## 🔧 Personalização

### Modificar o horário da tarefa:
Editar `server/services/engagementTasks.js`, linha ~85:
```javascript
dueDate: new Date(session.date.getFullYear(), session.date.getMonth(), session.date.getDate(), 8, 0, 0), // 8h da manhã
```

### Modificar a mensagem sugerida:
Editar `server/services/engagementTasks.js`, linha ~90:
```javascript
`💬 Sugestão de mensagem:\n` +
`"Bom dia! 🌟 Hoje temos aula de ${classInfo.name} às ${session.startTime || 'horário marcado'}. ` +
`Estamos ansiosos para ver você! Não esqueça de trazer seu material. Até logo! 📚"`
```

### Modificar quem recebe a tarefa:
Por padrão, a tarefa é atribuída ao primeiro usuário administrativo (Manager/Admin) da unidade.
Se não houver, é atribuída ao professor da turma.

Para mudar, editar `server/services/engagementTasks.js`, linha ~70:
```javascript
const adminUsers = await User.findAll({
    where: {
        unitId: classInfo.unitId,
        roleId: {
            [Op.in]: [3, 4, 5] // Manager, Admin, Admin_Financial_Manager
        }
    }
});
```

## 📱 Integração com WhatsApp (Futuro)

O sistema está preparado para integração futura com WhatsApp Business API:
- Lista de telefones já está incluída
- Mensagem formatada e pronta
- Possível adicionar botão "Enviar para WhatsApp" na tarefa

## ⚠️ Observações Importantes

1. **Apenas alunos ativos** - Só inclui alunos com matrícula ativa
2. **Apenas aulas agendadas** - Só cria tarefas para aulas com status "scheduled"
3. **Uma tarefa por aula** - Cada aula gera uma tarefa separada
4. **Não duplica** - Se executar múltiplas vezes no mesmo dia, criará tarefas duplicadas (considerar adicionar verificação)

## 🐛 Troubleshooting

### Nenhuma tarefa criada?
- Verificar se há aulas agendadas para hoje
- Verificar se as aulas têm alunos matriculados
- Verificar logs do console

### Tarefas não aparecem no sistema?
- Verificar se o usuário tem permissão para ver tarefas administrativas
- Verificar filtros de data na página de tarefas

### Erro de conexão com banco?
- Verificar se o servidor está rodando
- Verificar credenciais do banco em `config/database.js`

## 📞 Suporte

Para dúvidas ou problemas, verificar:
1. Logs do sistema
2. Console do navegador (F12)
3. Arquivo de log (se configurado no cron)
