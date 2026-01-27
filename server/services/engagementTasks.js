const { Task, ClassSession, Class, Student, Enrollment, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Gera tarefas de engajamento de alunos para dias de aula
 * Deve ser executado diariamente no início do dia (ex: 6h da manhã)
 */
async function generateEngagementTasks() {
    try {
        console.log('🎯 Gerando tarefas de engajamento de alunos...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Buscar todas as aulas agendadas para hoje
        const todaySessions = await ClassSession.findAll({
            where: {
                date: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            include: [
                {
                    model: Class,
                    include: [
                        {
                            model: User,
                            as: 'professor',
                            attributes: ['id', 'name', 'roleId']
                        }
                    ]
                }
            ]
        });

        console.log(`📅 Encontradas ${todaySessions.length} aulas para hoje`);

        let tasksCreated = 0;

        for (const session of todaySessions) {
            const classInfo = session.Class;
            if (!classInfo) {
                console.log(`  ⚠️  Sessão ${session.id} sem turma associada`);
                continue;
            }

            console.log(`\n  📚 Processando: ${classInfo.name} (ID: ${classInfo.id})`);

            // Buscar alunos matriculados nesta turma
            const enrollments = await Enrollment.findAll({
                where: {
                    classId: classInfo.id,
                    status: 'active'
                },
                include: [
                    {
                        model: Student,
                        attributes: ['id', 'name', 'phone']
                    }
                ]
            });

            console.log(`     - Alunos matriculados: ${enrollments.length}`);

            if (enrollments.length === 0) {
                console.log(`     ⚠️  Nenhum aluno matriculado, pulando...`);
                continue;
            }

            // Buscar usuários administrativos da unidade
            const adminUsers = await User.findAll({
                where: {
                    unitId: classInfo.unitId,
                    roleId: {
                        [Op.in]: [3, 4, 5] // Manager, Admin, Admin_Financial_Manager
                    }
                }
            });

            // Se não houver admin, atribuir ao professor
            const assignedUserId = adminUsers.length > 0
                ? adminUsers[0].id
                : classInfo.professorId;

            // Criar lista de alunos
            const studentsList = enrollments
                .map(e => `- ${e.Student.name}${e.Student.phone ? ` (${e.Student.phone})` : ''}`)
                .join('\n');

            // Criar tarefa de engajamento
            const task = await Task.create({
                title: `Engajamento - ${classInfo.name} - Aula ${session.sessionNumber || 'N/A'}`,
                description: `📱 Enviar mensagem de engajamento para os alunos da turma ${classInfo.name}\n\n` +
                    `🕐 Horário da aula: ${session.startTime || 'N/A'}\n` +
                    `📍 Local: ${session.location || 'N/A'}\n\n` +
                    `👥 Alunos (${enrollments.length}):\n${studentsList}\n\n` +
                    `💬 Sugestão de mensagem:\n` +
                    `"Bom dia! 🌟 Hoje temos aula de ${classInfo.name} às ${session.startTime || 'horário marcado'}. ` +
                    `Estamos ansiosos para ver você! Não esqueça de trazer seu material. Até logo! 📚"`,
                dueDate: new Date(session.date.getFullYear(), session.date.getMonth(), session.date.getDate(), 8, 0, 0), // 8h da manhã
                status: 'pending',
                priority: 'high',
                category: 'administrative',
                userId: assignedUserId,
                unitId: classInfo.unitId
            });

            tasksCreated++;
            console.log(`  ✅ Tarefa criada: ${task.title}`);
        }

        console.log(`\n✨ ${tasksCreated} tarefas de engajamento criadas com sucesso!`);

        return {
            success: true,
            tasksCreated,
            sessionsProcessed: todaySessions.length
        };

    } catch (error) {
        console.error('❌ Erro ao gerar tarefas de engajamento:', error);
        throw error;
    }
}

module.exports = { generateEngagementTasks };
