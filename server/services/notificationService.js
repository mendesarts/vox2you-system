const { Op } = require('sequelize');
require('../models/associations'); // Load associations
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const FinancialRecord = require('../models/FinancialRecord');
const Task = require('../models/Task');
const User = require('../models/User');

class NotificationService {
    /**
     * Verifica e cria notificações para alunos em risco
     */
    async checkStudentsAtRisk() {
        try {
            console.log('🔔 Verificando alunos em risco...');

            const students = await Student.findAll({
                where: { status: 'active' }
            });

            const notifications = [];

            for (const student of students) {
                // Verificar faltas consecutivas
                const recentAttendances = await Attendance.findAll({
                    where: { studentId: student.id },
                    order: [['date', 'DESC']],
                    limit: 5
                });

                let consecutiveAbsences = 0;
                for (const att of recentAttendances) {
                    if (att.status === 'absent') {
                        consecutiveAbsences++;
                    } else {
                        break;
                    }
                }

                if (consecutiveAbsences >= 2) {
                    // Criar tarefa para o professor/coordenador
                    const professor = await User.findOne({
                        where: { unitId: student.unitId, roleId: { [Op.in]: [2, 4, 5] } }
                    });

                    if (professor) {
                        const existingTask = await Task.findOne({
                            where: {
                                title: `Aluno em risco: ${student.name}`,
                                userId: professor.id,
                                status: 'pending'
                            }
                        });

                        if (!existingTask) {
                            await Task.create({
                                title: `Aluno em risco: ${student.name}`,
                                description: `O aluno ${student.name} teve ${consecutiveAbsences} faltas consecutivas. É necessário entrar em contato.`,
                                dueDate: new Date(),
                                priority: 'high',
                                status: 'pending',
                                userId: professor.id,
                                studentId: student.id,
                                type: 'follow_up'
                            });

                            notifications.push({
                                type: 'consecutive_absences',
                                student: student.name,
                                count: consecutiveAbsences,
                                assignedTo: professor.name
                            });
                        }
                    }
                }

                // Verificar frequência geral
                const totalAttendances = await Attendance.count({
                    where: { studentId: student.id }
                });

                if (totalAttendances >= 5) {
                    const absences = await Attendance.count({
                        where: { studentId: student.id, status: 'absent' }
                    });

                    const attendanceRate = ((totalAttendances - absences) / totalAttendances) * 100;

                    if (attendanceRate < 75) {
                        const professor = await User.findOne({
                            where: { unitId: student.unitId, roleId: { [Op.in]: [2, 4, 5] } }
                        });

                        if (professor) {
                            const existingTask = await Task.findOne({
                                where: {
                                    title: `Baixa frequência: ${student.name}`,
                                    userId: professor.id,
                                    status: 'pending'
                                }
                            });

                            if (!existingTask) {
                                await Task.create({
                                    title: `Baixa frequência: ${student.name}`,
                                    description: `O aluno ${student.name} está com frequência de ${attendanceRate.toFixed(1)}% (mínimo: 75%). Necessário acompanhamento pedagógico.`,
                                    dueDate: new Date(),
                                    priority: 'medium',
                                    status: 'pending',
                                    userId: professor.id,
                                    studentId: student.id,
                                    type: 'follow_up'
                                });

                                notifications.push({
                                    type: 'low_attendance',
                                    student: student.name,
                                    rate: attendanceRate.toFixed(1),
                                    assignedTo: professor.name
                                });
                            }
                        }
                    }
                }
            }

            console.log(`✅ ${notifications.length} notificações criadas`);
            return notifications;

        } catch (error) {
            console.error('Erro ao verificar alunos em risco:', error);
            return [];
        }
    }

    /**
     * Verifica e cria notificações para pagamentos vencidos
     */
    async checkOverduePayments() {
        try {
            console.log('💰 Verificando pagamentos vencidos...');

            const overdueRecords = await FinancialRecord.findAll({
                where: {
                    status: 'pending',
                    dueDate: { [Op.lt]: new Date() },
                    studentId: { [Op.ne]: null }
                },
                include: [{ model: Student, as: 'student' }]
            });

            const notifications = [];

            // Agrupar por aluno
            const byStudent = {};
            for (const record of overdueRecords) {
                if (!record.student) continue;

                if (!byStudent[record.studentId]) {
                    byStudent[record.studentId] = {
                        student: record.student,
                        records: []
                    };
                }
                byStudent[record.studentId].records.push(record);
            }

            // Criar tarefas para o financeiro
            for (const studentId in byStudent) {
                const data = byStudent[studentId];
                const totalOverdue = data.records.reduce((sum, r) => sum + parseFloat(r.amount), 0);

                const financialUser = await User.findOne({
                    where: {
                        unitId: data.student.unitId,
                        roleId: { [Op.in]: [1, 4, 10] } // Master, Franqueado ou Diretor
                    }
                });

                if (financialUser) {
                    const existingTask = await Task.findOne({
                        where: {
                            title: `Cobrança: ${data.student.name}`,
                            userId: financialUser.id,
                            status: 'pending'
                        }
                    });

                    if (!existingTask) {
                        await Task.create({
                            title: `Cobrança: ${data.student.name}`,
                            description: `${data.records.length} parcela(s) em atraso totalizando R$ ${totalOverdue.toFixed(2)}. Entrar em contato para regularização.`,
                            dueDate: new Date(),
                            priority: data.records.length >= 3 ? 'high' : 'medium',
                            status: 'pending',
                            userId: financialUser.id,
                            studentId: data.student.id,
                            type: 'payment_follow_up'
                        });

                        notifications.push({
                            type: 'overdue_payment',
                            student: data.student.name,
                            count: data.records.length,
                            amount: totalOverdue,
                            assignedTo: financialUser.name
                        });
                    }
                }
            }

            console.log(`✅ ${notifications.length} notificações de pagamento criadas`);
            return notifications;

        } catch (error) {
            console.error('Erro ao verificar pagamentos vencidos:', error);
            return [];
        }
    }

    /**
     * Executa todas as verificações automáticas
     */
    async runAllChecks() {
        console.log('\n🤖 Iniciando verificações automáticas...\n');

        const studentsNotifications = await this.checkStudentsAtRisk();
        const paymentsNotifications = await this.checkOverduePayments();

        const total = studentsNotifications.length + paymentsNotifications.length;

        console.log(`\n✅ Total de ${total} notificações processadas\n`);

        return {
            students: studentsNotifications,
            payments: paymentsNotifications,
            total
        };
    }
}

module.exports = new NotificationService();
