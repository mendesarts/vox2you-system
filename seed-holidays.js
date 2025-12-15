// Native fetch supported

// Official National Holidays in Brazil for 2025 (Reference)
const holidays2025 = [
    { name: 'Confraternização Universal', date: '2025-01-01', type: 'holiday' },
    { name: 'Carnaval', date: '2025-03-03', type: 'recess' },
    { name: 'Carnaval', date: '2025-03-04', type: 'recess' },
    { name: 'Quarta-feira de Cinzas', date: '2025-03-05', type: 'recess' }, // until 14h usually, treating as recess
    { name: 'Sexta-feira Santa', date: '2025-04-18', type: 'holiday' },
    { name: 'Tiradentes', date: '2025-04-21', type: 'holiday' },
    { name: 'Dia do Trabalho', date: '2025-05-01', type: 'holiday' },
    { name: 'Corpus Christi', date: '2025-06-19', type: 'holiday' },
    { name: 'Independência do Brasil', date: '2025-09-07', type: 'holiday' },
    { name: 'Nossa Senhora Aparecida', date: '2025-10-12', type: 'holiday' },
    { name: 'Finados', date: '2025-11-02', type: 'holiday' },
    { name: 'Proclamação da República', date: '2025-11-15', type: 'holiday' },
    { name: 'Dia Nacional de Zumbi e da Consciência Negra', date: '2025-11-20', type: 'holiday' },
    { name: 'Natal', date: '2025-12-25', type: 'holiday' }
];

async function seedHolidays() {
    console.log('Inserindo feriados nacionais de 2025...');
    const baseUrl = 'http://localhost:3000/api/calendar/holidays';

    for (const h of holidays2025) {
        try {
            const body = {
                name: h.name,
                startDate: h.date,
                endDate: h.date,
                type: h.type
            };

            const res = await fetch(baseUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                console.log(`✅ ${h.name} (${h.date}) adicionado.`);
            } else {
                console.log(`⚠️ Erro ao adicionar ${h.name}: ${res.statusText}`);
            }
        } catch (error) {
            console.error(`❌ Erro de conexão para ${h.name}:`, error.message);
        }
    }
    console.log('🏁 Processo finalizado.');
}

seedHolidays();
