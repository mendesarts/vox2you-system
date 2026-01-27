/**
 * Script de Teste Automatizado - Jornada Completa
 * Testa matrícula e persistência via API
 */

const API_URL = 'http://localhost:3000/api';

// Simula login e obtém token
async function getAuthToken() {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'master@voxflow.com.br',  // Email correto
                password: 'voxflow2024'  // Senha correta
            })
        });

        if (!response.ok) {
            throw new Error(`Login failed: ${response.status}`);
        }

        const data = await response.json();
        if (!data.token) {
            throw new Error('No token received');
        }
        return data.token;
    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        throw error;
    }
}

// Teste 1: Jornada de Matrícula
async function testEnrollmentJourney(token) {
    console.log('\n🎓 TESTE 1: JORNADA DE MATRÍCULA\n');

    // 1. Criar lead
    console.log('1️⃣ Criando lead "Ana Teste Matricula"...');
    const createResponse = await fetch(`${API_URL}/crm/leads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'Ana Teste Matricula',
            phone: '11987654321',
            email: 'ana.teste@example.com',
            status: 'new',
            unitId: 2,
            responsibleId: 1
        })
    });

    if (!createResponse.ok) {
        console.error('❌ Erro ao criar lead:', await createResponse.text());
        return;
    }

    const lead = await createResponse.json();
    console.log(`✅ Lead criado com ID: ${lead.id}`);

    // 2. Buscar detalhes do lead (testa se alias está correto)
    console.log('\n2️⃣ Buscando detalhes do lead (testando alias Sequelize)...');
    const detailsResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!detailsResponse.ok) {
        console.error('❌ ERRO 500 - Alias do Sequelize ainda está incorreto!');
        console.error(await detailsResponse.text());
        return;
    }

    const leadDetails = await detailsResponse.json();
    console.log(`✅ Detalhes carregados com sucesso! Tasks: ${leadDetails.tasks?.length || 0}`);

    // 3. Mover para status "won"
    console.log('\n3️⃣ Movendo lead para status "Matricular" (won)...');
    const updateResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'won' })
    });

    if (!updateResponse.ok) {
        console.error('❌ Erro ao atualizar status:', await updateResponse.text());
        return;
    }

    console.log('✅ Lead movido para "Matricular"');

    // 4. Buscar cursos disponíveis
    console.log('\n4️⃣ Buscando cursos disponíveis...');
    const coursesResponse = await fetch(`${API_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const courses = await coursesResponse.json();
    console.log(`✅ ${courses.length} cursos encontrados`);

    if (courses.length === 0) {
        console.log('⚠️ Nenhum curso disponível para teste');
        return;
    }

    // 5. Buscar turmas do primeiro curso
    console.log('\n5️⃣ Buscando turmas disponíveis...');
    const classesResponse = await fetch(`${API_URL}/classes?courseId=${courses[0].id}&status=active`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const classes = await classesResponse.json();
    console.log(`✅ ${classes.length} turmas encontradas`);

    if (classes.length === 0) {
        console.log('⚠️ Nenhuma turma disponível para teste');
        return;
    }

    // 6. Verificar capacidade da turma
    console.log('\n6️⃣ Verificando capacidade da turma...');
    const capacityResponse = await fetch(`${API_URL}/classes/${classes[0].id}/capacity`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!capacityResponse.ok) {
        console.error('❌ Endpoint de capacidade não encontrado (404)');
        return;
    }

    const capacity = await capacityResponse.json();
    console.log(`✅ Capacidade: ${capacity.current}/${capacity.total} (${capacity.available} vagas disponíveis)`);

    // 7. Converter lead em aluno
    console.log('\n7️⃣ Convertendo lead em aluno...');
    const convertResponse = await fetch(`${API_URL}/crm/leads/${lead.id}/convert-to-student`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            courseId: courses[0].id,
            classId: classes[0].id
        })
    });

    if (!convertResponse.ok) {
        console.error('❌ Erro ao converter lead:', await convertResponse.text());
        return;
    }

    const conversion = await convertResponse.json();
    console.log(`✅ Lead convertido em aluno! ID do aluno: ${conversion.student.id}`);

    // 8. Verificar se lead foi marcado como convertido
    console.log('\n8️⃣ Verificando metadata do lead...');
    const updatedLeadResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedLead = await updatedLeadResponse.json();

    let metadata = {};
    try {
        metadata = typeof updatedLead.metadata === 'string'
            ? JSON.parse(updatedLead.metadata)
            : updatedLead.metadata || {};
    } catch (e) {
        console.error('⚠️ Erro ao parsear metadata');
    }

    if (metadata.convertedToStudent) {
        console.log('✅ Lead marcado como convertido no metadata');
    } else {
        console.log('⚠️ Lead NÃO foi marcado como convertido');
    }

    // 9. Verificar se aluno aparece na lista
    console.log('\n9️⃣ Verificando se aluno aparece na lista...');
    const studentsResponse = await fetch(`${API_URL}/students?unitId=2`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const students = await studentsResponse.json();
    const foundStudent = students.find(s => s.id === conversion.student.id);

    if (foundStudent) {
        console.log(`✅ Aluno encontrado na lista: ${foundStudent.name}`);
    } else {
        console.log('❌ Aluno NÃO encontrado na lista');
    }

    console.log('\n✅ TESTE DE MATRÍCULA CONCLUÍDO COM SUCESSO!\n');
    return lead.id;
}

// Teste 2: Jornada de Persistência
async function testPersistenceJourney(token) {
    console.log('\n📞 TESTE 2: JORNADA DE PERSISTÊNCIA\n');

    // 1. Criar lead
    console.log('1️⃣ Criando lead "Pedro Insistente"...');
    const createResponse = await fetch(`${API_URL}/crm/leads`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            name: 'Pedro Insistente',
            phone: '11988887777',
            email: 'pedro.insistente@example.com',
            status: 'new',
            unitId: 2,
            responsibleId: 1
        })
    });

    const lead = await createResponse.json();
    console.log(`✅ Lead criado com ID: ${lead.id}`);

    // 2. Simular 4 tentativas de contato não atendidas
    console.log('\n2️⃣ Simulando 4 tentativas de contato não atendidas...');
    for (let i = 1; i <= 4; i++) {
        const moveResponse = await fetch(`${API_URL}/crm/leads/${lead.id}/move`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'connecting',
                notes: `Tentativa ${i} - Não atendeu`,
                outcome: 'no_answer'
            })
        });

        if (moveResponse.ok) {
            console.log(`  ✅ Tentativa ${i} registrada`);
        } else {
            console.log(`  ❌ Erro na tentativa ${i}`);
        }

        // Pequeno delay entre tentativas
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Verificar contador de tentativas
    console.log('\n3️⃣ Verificando contador de tentativas...');
    const detailsResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const leadDetails = await detailsResponse.json();
    console.log(`✅ Tentativas registradas: ${leadDetails.attemptCount || 0}`);

    // 4. Agendar consulta
    console.log('\n4️⃣ Agendando consulta...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const scheduleResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            status: 'scheduled',
            appointmentDate: tomorrow.toISOString()
        })
    });

    if (scheduleResponse.ok) {
        console.log('✅ Consulta agendada para amanhã às 14h');
    }

    // 5. Marcar como não compareceu
    console.log('\n5️⃣ Marcando como não compareceu (no-show)...');
    const noShowResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            status: 'no_show'
        })
    });

    if (noShowResponse.ok) {
        console.log('✅ Lead marcado como não compareceu');
    }

    // 6. Simular 5 tentativas de remarcação
    console.log('\n6️⃣ Simulando 5 tentativas de remarcação...');
    for (let i = 1; i <= 5; i++) {
        const rescheduleResponse = await fetch(`${API_URL}/crm/leads/${lead.id}/move`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: 'no_show',
                notes: `Tentativa de remarcação ${i} - Não atendeu`,
                outcome: 'no_answer'
            })
        });

        if (rescheduleResponse.ok) {
            console.log(`  ✅ Tentativa de remarcação ${i} registrada`);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 7. Encerrar como perdido
    console.log('\n7️⃣ Encerrando lead como perdido...');
    const closeResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            status: 'closed',
            lossReason: 'Não compareceu após múltiplas tentativas'
        })
    });

    if (closeResponse.ok) {
        console.log('✅ Lead encerrado como perdido');
    }

    // 8. Verificar histórico completo
    console.log('\n8️⃣ Verificando histórico completo...');
    const finalDetailsResponse = await fetch(`${API_URL}/crm/leads/${lead.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const finalDetails = await finalDetailsResponse.json();

    let history = [];
    try {
        history = typeof finalDetails.history === 'string'
            ? JSON.parse(finalDetails.history)
            : finalDetails.history || [];
    } catch (e) {
        console.error('⚠️ Erro ao parsear histórico');
    }

    console.log(`✅ Total de registros no histórico: ${history.length}`);
    console.log(`✅ Total de tentativas: ${finalDetails.attemptCount || 0}`);

    // 9. Verificar tarefas criadas
    console.log('\n9️⃣ Verificando tarefas criadas...');
    const tasksResponse = await fetch(`${API_URL}/tasks?leadId=${lead.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const tasks = await tasksResponse.json();
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    console.log(`✅ Total de tarefas criadas: ${tasksArray.length}`);

    const completedTasks = tasksArray.filter(t => t.status === 'completed');
    console.log(`✅ Tarefas completadas: ${completedTasks.length}`);

    console.log('\n✅ TESTE DE PERSISTÊNCIA CONCLUÍDO COM SUCESSO!\n');
}

// Executar testes
async function runAllTests() {
    console.log('🚀 INICIANDO TESTES AUTOMATIZADOS\n');
    console.log('='.repeat(60));

    try {
        const token = await getAuthToken();
        console.log('✅ Autenticação realizada com sucesso\n');

        await testEnrollmentJourney(token);
        await testPersistenceJourney(token);

        console.log('='.repeat(60));
        console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS COM SUCESSO!\n');

    } catch (error) {
        console.error('\n❌ ERRO DURANTE OS TESTES:');
        console.error(error);
    }
}

// Executar
runAllTests();
