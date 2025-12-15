// Native fetch supported

// Official National Holidays in Brazil for 2026
const holidays2026 = [
    { name: 'Confraternização Universal', date: '2026-01-01', type: 'holiday' },
    { name: 'Carnaval', date: '2026-02-16', type: 'recess' },
    { name: 'Carnaval', date: '2026-02-17', type: 'recess' },
    { name: 'Quarta-feira de Cinzas', date: '2026-02-18', type: 'recess' },
    { name: 'Sexta-feira Santa', date: '2026-04-03', type: 'holiday' },
    { name: 'Tiradentes', date: '2026-04-21', type: 'holiday' },
    { name: 'Dia do Trabalho', date: '2026-05-01', type: 'holiday' },
    { name: 'Corpus Christi', date: '2026-06-04', type: 'holiday' },
    { name: 'Independência do Brasil', date: '2026-09-07', type: 'holiday' },
    { name: 'Nossa Senhora Aparecida', date: '2026-10-12', type: 'holiday' },
    { name: 'Finados', date: '2026-11-02', type: 'holiday' },
    { name: 'Proclamação da República', date: '2026-11-15', type: 'holiday' },
    { name: 'Dia Nacional de Zumbi e da Consciência Negra', date: '2026-11-20', type: 'holiday' },
    { name: 'Natal', date: '2026-12-25', type: 'holiday' }
];

async function seedHolidays2026() {
    console.log('Inserindo feriados nacionais de 2026...');
    const baseUrl = 'http://localhost:3000/api/calendar/holidays';

    for (const h of holidays2026) {
        try {
            // Check if already exists (simple check not implemented in API, so we rely on manual distinctness for this script)
            // Just posting.
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

seedHolidays2026();
