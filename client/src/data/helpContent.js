const helpContent = {
    dashboard: {
        title: 'Painel Geral',
        content: `
            <p>Bem-vindo ao Dashboard Geral da Vox2you. Aqui você tem uma visão panorâmica da escola.</p>
            <ul>
                <li><strong>Alunos Ativos:</strong> Total de alunos com matrícula vigente.</li>
                <li><strong>Leads:</strong> Potenciais alunos no pipeline comercial.</li>
                <li><strong>Faturamento:</strong> Receita bruta acumulada (baseada em lançamentos pagos).</li>
            </ul>
            <p>Use este painel para acompanhar as metas do dia e avisos importantes.</p>
        `
    },
    crm: {
        title: 'Gestão Comercial (CRM)',
        content: `
            <p>Gerencie seus leads e oportunidades de venda aqui.</p>
            <ul>
                <li><strong>Colunas:</strong> Arraste os cards entre as colunas para atualizar o status (Novo, Em Negociação, Matrículado, etc).</li>
                <li><strong>Novo Lead:</strong> Clique no botão "+" para cadastrar um interessado. Preencha nome, telefone e origem.</li>
                <li><strong>Agendamentos:</strong> Use a agenda para marcar reuniões ou follow-ups.</li>
            </ul>
            <p><strong>Dica:</strong> Mantenha o histórico de conversas atualizado nos detalhes do card.</p>
        `
    },
    secretary_dashboard: {
        title: 'Painel Administrativo',
        content: `
            <p>Área central para gestão da secretaria e operações diárias.</p>
            <ul>
                <li><strong>Nova Matrícula:</strong> Inicie o processo de matrícula de um novo aluno (Assistente passo-a-passo).</li>
                <li><strong>Gerenciar Alunos:</strong> Pesquise, edite e visualize detalhes de todos os alunos.</li>
                <li><strong>Gerenciar Turmas:</strong> Crie novas turmas, atribua professores e horários.</li>
                <li><strong>Relatórios:</strong> Acesse listas de presença, inadimplência e outros documentos.</li>
            </ul>
        `
    },
    students_manager: {
        title: 'Gestão de Alunos',
        content: `
            <p>Gerencie o cadastro completo dos alunos.</p>
            <ul>
                <li><strong>Filtros:</strong> Use os filtros no topo para buscar por status (Ativo, Trancado, etc).</li>
                <li><strong>Detalhes:</strong> Clique no nome do aluno para ver histórico financeiro, notas e frequência.</li>
                <li><strong>Edição:</strong> Use o botão de lápis para atualizar dados cadastrais.</li>
            </ul>
        `
    },
    classes_manager: {
        title: 'Gestão de Turmas',
        content: `
            <p>Controle das turmas e alocação de alunos.</p>
            <ul>
                <li><strong>Nova Turma:</strong> Defina o curso, professor, dias da semana e horário.</li>
                <li><strong>Lista de Alunos:</strong> Adicione ou remova alunos de uma turma existente.</li>
                <li><strong>Diário de Classe:</strong> Os professores podem lançar presença através do portal deles, mas você pode ajustar aqui se necessário.</li>
            </ul>
        `
    },
    financial_dashboard: {
        title: 'Painel Financeiro',
        content: `
            <p>Visão geral da saúde financeira da unidade.</p>
            <ul>
                <li><strong>Contas a Receber:</strong> Soma de todas as parcelas em aberto ou vencidas.</li>
                <li><strong>Contas a Pagar:</strong> Previsão de despesas cadastradas.</li>
                <li><strong>Receita Realizada:</strong> Valor efetivamente recebido (baixas realizadas).</li>
            </ul>
        `
    },
    cash_flow: {
        title: 'Fluxo de Caixa',
        content: `
            <p>Controle diário do caixa físico da escola.</p>
            <ul>
                <li><strong>Abertura:</strong> Informe o valor em dinheiro disponível no cofre/gaveta no início do dia.</li>
                <li><strong>Movimentações:</strong> Lance <strong>Suprimentos</strong> (entrada de troco/aportes) ou <strong>Sangrias</strong> (retiradas para depósito/pagamentos).</li>
                <li><strong>Fechamento:</strong> Ao final do dia, conte o dinheiro e lance o valor real. O sistema calculará sobras ou faltas.</li>
                <li><strong>Nota:</strong> Recebimentos de mensalidade em dinheiro caem aqui automaticamente se o caixa estiver aberto.</li>
            </ul>
        `
    },
    financial_records: {
        title: 'Gestão de Lançamentos',
        content: `
            <p>Controle detalhado de todas as cobranças e pagamentos.</p>
            <ul>
                <li><strong>Baixa (Quitação):</strong> Clique no botão de "Check" verde para confirmar o recebimento de uma parcela. Selecione a forma de pagamento (Pix, Dinheiro, etc).</li>
                <li><strong>Busca:</strong> Procure pelo nome do aluno para ver o histórico financeiro completo.</li>
            </ul>
        `
    },
    dre: {
        title: 'DRE Gerencial',
        content: `
            <p>Demonstração do Resultado do Exercício.</p>
            <ul>
                <li><strong>Receita Bruta:</strong> Soma de todos os recebimentos confirmados no período.</li>
                <li><strong>Despesas:</strong> Gastos operacionais lançados.</li>
                <li><strong>Resultado Liq:</strong> O lucro ou prejuízo real do período selecionado.</li>
            </ul>
            <p>Use os filtros de data para analisar mensalmente ou anualmente.</p>
        `
    },
    settings: {
        title: 'Configurações',
        content: `
            <p>Ajustes globais do sistema.</p>
            <ul>
                <li><strong>Dados da Unidade:</strong> Mantenha endereço e contatos atualizados (aparecem em contratos).</li>
                <li><strong>Usuários:</strong> Cadastre novos funcionários e defina seus níveis de acesso (Admin, Comercial, Professor).</li>
                <li><strong>Cursos:</strong> Configure a grade curricular, preços e módulos.</li>
            </ul>
        `
    },
    calendar: {
        title: 'Calendário Escolar',
        content: `
            <p>Agenda geral de aulas e eventos.</p>
            <ul>
                <li>Visualize o horário de todas as turmas.</li>
                <li>Clique em uma aula para ver detalhes.</li>
            </ul>
        `
    },
    pedagogical: {
        title: 'Pedagógico',
        content: `
            <p>Área focada no desempenho acadêmico.</p>
            <ul>
                <li>Verifique a frequência dos alunos.</li>
                <li>Monitore o progresso nos módulos.</li>
            </ul>
        `
    }
};

export default helpContent;
