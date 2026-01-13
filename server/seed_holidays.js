const { Sequelize } = require('sequelize');
const sequelize = require('./config/database');
const Holiday = require('./models/Holiday');

// Lista Fixa de Feriados Nacionais 2024-2025
const NATIONAL_HOLIDAYS = [
    // 2024
    { date: '2024-01-01', name: 'Ano Novo', type: 'national' },
    { date: '2024-02-12', name: 'Carnaval', type: 'national' },
    { date: '2024-02-13', name: 'Carnaval', type: 'national' },
    { date: '2024-03-29', name: 'Sexta-feira Santa', type: 'national' },
    { date: '2024-04-21', name: 'Tiradentes', type: 'national' },
    { date: '2024-05-01', name: 'Dia do Trabalho', type: 'national' },
    { date: '2024-05-30', name: 'Corpus Christi', type: 'national' },
    { date: '2024-09-07', name: 'Independência do Brasil', type: 'national' },
    { date: '2024-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
    { date: '2024-11-02', name: 'Finados', type: 'national' },
    { date: '2024-11-15', name: 'Proclamação da República', type: 'national' },
    { date: '2024-11-20', name: 'Dia da Consciência Negra', type: 'national' },
    { date: '2024-12-25', name: 'Natal', type: 'national' },
    // 2025
    { date: '2025-01-01', name: 'Confraternização Universal', type: 'national' },
    { date: '2025-03-03', name: 'Carnaval', type: 'national' },
    { date: '2025-03-04', name: 'Carnaval', type: 'national' },
    { date: '2025-04-18', name: 'Sexta-feira Santa', type: 'national' },
    { date: '2025-04-21', name: 'Tiradentes', type: 'national' },
    { date: '2025-05-01', name: 'Dia do Trabalho', type: 'national' },
    { date: '2025-06-19', name: 'Corpus Christi', type: 'national' },
    { date: '2025-09-07', name: 'Independência do Brasil', type: 'national' },
    { date: '2025-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
    { date: '2025-11-02', name: 'Finados', type: 'national' },
    { date: '2025-11-15', name: 'Proclamação da República', type: 'national' },
    { date: '2025-11-20', name: 'Dia da Consciência Negra', type: 'national' },
    { date: '2025-12-25', name: 'Natal', type: 'national' }
];

async function seedHolidays() {
    try {
        await sequelize.authenticate();
        console.log('Conectado ao Database...');

        await sequelize.sync(); // Garante tabela

        console.log('Iniciando carga de feriados nacionais...');

        for (const h of NATIONAL_HOLIDAYS) {
            // Verifica se já existe (pela data e nome)
            const exists = await Holiday.findOne({
                where: {
                    startDate: h.date,
                    name: h.name
                }
            });

            if (!exists) {
                await Holiday.create({
                    name: h.name,
                    startDate: h.date,
                    endDate: h.date, // 1 Day
                    type: 'holiday',
                    // unitId: null // Se a coluna existir no banco (via associations), o Sequelize tenta salvar. 
                    // Como não carregamos associações aqui, ele pode ignorar ou dar erro se for validação estrita.
                    // Vamos tentar sem unitId explícito no create, assumindo default null.
                });
                console.log(`[+] Criado: ${h.date} - ${h.name}`);
            } else {
                console.log(`[.] Já existe: ${h.date} - ${h.name}`);
            }
        }

        console.log('Feriados importados com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('Erro ao semear feriados:', error);
        process.exit(1);
    }
}

seedHolidays();
