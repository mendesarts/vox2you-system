// Native fetch is supported in Node 18+

const courseId = '6e57afc8-5a91-4805-8712-392f2fe6ea2f'; // ID from the curl output
const baseUrl = 'http://localhost:3000/api/courses';

const modules = [
    { title: 'Fundamentos da Oratória', description: 'Introdução à comunicação eficaz e autoconhecimento.', duration: 120, order: 1 },
    { title: 'Vencendo o Medo', description: 'Técnicas para controlar a ansiedade e o nervosismo.', duration: 120, order: 2 },
    { title: 'Linguagem Corporal', description: 'Postura, gestos e contato visual assertivo.', duration: 120, order: 3 },
    { title: 'Voz e Dicção', description: 'Potência vocal, entonação e clareza na fala.', duration: 120, order: 4 },
    { title: 'Estruturação do Discurso', description: 'Começo, meio e fim: como organizar suas ideias.', duration: 120, order: 5 },
    { title: 'Storytelling', description: 'A arte de contar histórias para engajar a audiência.', duration: 120, order: 6 },
    { title: 'Técnicas de Improviso', description: 'Como lidar com imprevistos e perguntas difíceis.', duration: 120, order: 7 },
    { title: 'Recursos Visuais', description: 'Uso estratégico de slides e materiais de apoio.', duration: 120, order: 8 },
    { title: 'Técnicas de Persuasão', description: 'Gatilhos mentais e argumentação convincente.', duration: 120, order: 9 },
    { title: 'Leitura Expressiva', description: 'Interpretando textos com emoção e técnica.', duration: 120, order: 10 },
    { title: 'Oratória Digital', description: 'Comunicação em vídeos, reuniões online e lives.', duration: 120, order: 11 },
    { title: 'Marketing Pessoal', description: 'Construindo sua imagem e marca pessoal.', duration: 120, order: 12 },
    { title: 'Apresentação Final', description: 'Prática integrativa e feedback individualizado.', duration: 180, order: 13 }
];

async function restoreModules() {
    console.log(`Restaurando 13 aulas para o curso ID: ${courseId}...`);

    for (const mod of modules) {
        try {
            const response = await fetch(`${baseUrl}/${courseId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mod)
            });

            if (response.ok) {
                console.log(`✅ Aula "${mod.title}" restaurada.`);
            } else {
                const err = await response.text();
                console.error(`❌ Falha ao restaurar "${mod.title}": ${err}`);
            }
        } catch (error) {
            console.error(`❌ Erro de conexão: ${error.message}`);
        }
    }
    console.log('🏁 Processo finalizado.');
}

restoreModules();
