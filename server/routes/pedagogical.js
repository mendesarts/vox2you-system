const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Mentorship = require('../models/Mentorship');
const UnitConfig = require('../models/UnitConfig');
const Task = require('../models/Task');
const User = require('../models/User');
const Transfer = require('../models/Transfer');
const StudentLog = require('../models/StudentLog');
const Module = require('../models/Module');
const ClassSession = require('../models/ClassSession');

const { ROLE_IDS } = require('../config/roles');
const auth = require('../middleware/auth');
const Sequelize = require('sequelize');
const { checkUnitIsolation } = require('../utils/unitIsolation');
const fs = require('fs');
const path = require('path');
const DEBUG_FILE = path.join(__dirname, '../debug-pedagogical.log');
const logDebug = (msg) => { try { fs.appendFileSync(DEBUG_FILE, new Date().toISOString() + ': ' + msg + '\n'); } catch (e) { } };

// Helper to add logs
const addStudentLog = async (studentId, action, description, details = {}) => {
    try {
        await StudentLog.create({ studentId, action, description, details });
    } catch (e) {
        console.error('Log Error:', e);
    }
};

router.get('/stats', auth, async (req, res) => {
    try {
        const { id, unitId, role, roleId } = req.user;
        const isGlobalUser = ['master', 'diretor'].includes(String(role).toLowerCase());
        const whereUnit = (!isGlobalUser && unitId) ? { unitId } : {};

        // Context specific filters
        const classWhere = { ...whereUnit, status: 'active' };
        if (roleId === ROLE_IDS.INSTRUCTOR) {
            classWhere.professorId = id;
        }

        // Active Students (In active classes of the unit/professor)
        // For simplicity, just unit filter on Student for now, but strict instructor view requires joining Class
        const studentWhere = { ...whereUnit, status: 'active' };
        // Ideally filter students by class.professorId for Instructors

        logDebug(`STATS REQ: User=${req.user.email} Role=${role} Unit=${unitId}`);
        logDebug(`CLASS WHERE: ${JSON.stringify(classWhere)}`);

        const activeStudents = await Student.count({ where: studentWhere });
        const activeClasses = await Class.count({ where: classWhere });
        logDebug(`COUNTS: ActiveClasses=${activeClasses}, ActiveStudents=${activeStudents}`);

        // Month Dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        // Mentorships Stats
        // Scheduled: Count ALL pending/scheduled mentorships regardless of date (Work Queue)
        const mentorshipsMonthScheduled = await Mentorship.count({
            include: [{ model: Student, where: whereUnit }],
            where: {
                status: 'scheduled'
            }
        });

        // Completed: Count properly within the current month (Production)
        const mentorshipsMonthCompleted = await Mentorship.count({
            include: [{ model: Student, where: whereUnit }],
            where: {
                status: 'completed',
                scheduledDate: { [Op.between]: [startOfMonth, endOfMonth] }
            }
        });

        // Student Stats
        const lockedStudents = await Student.count({ where: { ...whereUnit, status: 'locked' } });
        const graduatedStudents = await Student.count({ where: { ...whereUnit, status: 'completed' } });
        const totalStudents = await Student.count({ where: whereUnit });

        // Attendance Average (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendances = await Attendance.findAll({
            include: [{ model: Class, where: classWhere }], // Filter by class permissions
            where: {
                date: { [Op.gte]: thirtyDaysAgo }
            }
        });

        let attendanceRate = 0;
        if (attendances.length > 0) {
            const presenceCount = attendances.filter(a => a.present).length;
            attendanceRate = ((presenceCount / attendances.length) * 100).toFixed(1);
        }

        const atRisk = 0;

        res.json({
            activeStudents,
            activeClasses,
            attendanceRate: `${attendanceRate}%`,
            atRisk,
            mentorshipsMonthScheduled,
            mentorshipsMonthCompleted,
            lockedStudents,
            graduatedStudents,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /pedagogical/charts
router.get('/charts', auth, async (req, res) => {
    try {
        const { unitId, role } = req.user;
        const { classId } = req.query;
        const isGlobalUser = ['master', 'diretor'].includes(String(role).toLowerCase());

        const where = {};
        if (!isGlobalUser && unitId) where.unitId = unitId;
        if (classId && classId !== 'all') where.classId = classId;

        const students = await Student.findAll({ where });

        // Gender Distribution
        const genderCounts = students.reduce((acc, s) => {
            const g = s.gender || 'Não Informado';
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {});
        const genderData = Object.keys(genderCounts).map(name => ({ name, value: genderCounts[name] }));

        // Age Analysis
        const ageCategories = [
            { name: '0-12', value: 0 },
            { name: '13-17', value: 0 },
            { name: '18-24', value: 0 },
            { name: '25-34', value: 0 },
            { name: '35-44', value: 0 },
            { name: '45+', value: 0 }
        ];
        students.forEach(s => {
            if (!s.birthDate) return;
            const age = new Date().getFullYear() - new Date(s.birthDate).getFullYear();
            if (age <= 12) ageCategories[0].value++;
            else if (age <= 17) ageCategories[1].value++;
            else if (age <= 24) ageCategories[2].value++;
            else if (age <= 34) ageCategories[3].value++;
            else if (age <= 44) ageCategories[4].value++;
            else ageCategories[5].value++;
        });

        // Neighborhood (Top 5)
        const neighborhoodCounts = students.reduce((acc, s) => {
            if (s.neighborhood) acc[s.neighborhood] = (acc[s.neighborhood] || 0) + 1;
            return acc;
        }, {});
        const neighborhoodData = Object.keys(neighborhoodCounts)
            .map(name => ({ name, value: neighborhoodCounts[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // City (Top 5)
        const cityCounts = students.reduce((acc, s) => {
            if (s.city) acc[s.city] = (acc[s.city] || 0) + 1;
            return acc;
        }, {});
        const cityData = Object.keys(cityCounts)
            .map(name => ({ name, value: cityCounts[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Attendance Frequency by Session (Last 6 Month/Recent)
        // Grouped by Class if classId provided, otherwise unit average
        const attendanceWhere = {};
        if (classId && classId !== 'all') attendanceWhere.classId = classId;
        // Joint filter logic needed if not classId... or just use classWhere from earlier

        const attendanceStats = await Attendance.findAll({
            where: {
                ...attendanceWhere,
                date: { [Op.gte]: new Date(new Date().setDate(new Date().getDate() - 90)) } // last 90 days
            },
            attributes: [
                [Sequelize.fn('date', Sequelize.col('date')), 'day'],
                [Sequelize.fn('count', Sequelize.col('id')), 'total'],
                [Sequelize.literal(`SUM(CASE WHEN present THEN 1 ELSE 0 END)`), 'presentCount']
            ],
            group: [Sequelize.fn('date', Sequelize.col('date'))],
            order: [[Sequelize.fn('date', Sequelize.col('date')), 'ASC']]
        });

        const frequencyData = attendanceStats.map(stat => ({
            name: new Date(stat.get('day')).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            rate: stat.get('total') > 0 ? Math.round((stat.get('presentCount') / stat.get('total')) * 100) : 0
        }));

        res.json({
            genderData,
            ageData: ageCategories,
            neighborhoodData,
            cityData,
            frequencyData
        });
    } catch (error) {
        console.error('Pedagogical Charts Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /pedagogical/attendance
router.post('/attendance', auth, async (req, res) => {
    try {
        const { studentId, classId, date, present } = req.body;
        const { roleId, id } = req.user;

        // Instructor Check: Must be professor of the class
        if (roleId === ROLE_IDS.INSTRUCTOR) {
            const cls = await Class.findByPk(classId);
            if (!cls || cls.professorId !== id) {
                return res.status(403).json({ error: 'Acesso negado. Você só pode lançar presença para suas turmas.' });
            }
        } else {
            // Other roles: Check unit isolation
            const student = await Student.findByPk(studentId);
            if (student && !checkUnitIsolation(res, req.user, student.unitId)) return;
        }

        const existing = await Attendance.findOne({
            where: { studentId, classId, date: new Date(date) }
        });

        if (existing) {
            await existing.update({ present });
        } else {
            await Attendance.create({
                studentId,
                classId,
                moduleId: req.body.moduleId, // Added
                date: new Date(date),
                present
            });
        }

        if (present) {
            const modTitle = req.body.moduleTitle || 'Aula';
            await addStudentLog(studentId, 'ATTENDANCE', `Assistiu a aula: ${modTitle}`, { date, classId, moduleId: req.body.moduleId });
        } else {
            // --- Risk Analysis ---
            const student = await Student.findByPk(studentId, {
                include: [{ model: Class, attributes: ['professorId'] }]
            });
            const config = await UnitConfig.findOne({ where: { unitId: student.unitId } });

            if (config && config.pedagogicalRules) {
                const limit = config.pedagogicalRules.consecutiveAbsencesLimit || 2;

                // Get last N attendances
                const lastAttendances = await Attendance.findAll({
                    where: { studentId },
                    order: [['date', 'DESC']],
                    limit: limit
                });

                const allAbsent = lastAttendances.length >= limit && lastAttendances.every(a => !a.present);

                if (allAbsent) {
                    // Create Task for the leader
                    const leaders = await User.findAll({
                        where: { unitId: student.unitId, roleId: ROLE_IDS.LEADER_PEDAGOGICAL },
                        attributes: ['id']
                    });

                    // Also get the student's current professor (using standard Association Accessor 'Class')
                    const professorId = student.Class?.professorId;
                    const professor = professorId ? await User.findByPk(professorId) : null;

                    const usersToNotify = [...leaders];
                    if (professor) usersToNotify.push(professor);

                    for (const targetUser of usersToNotify) {
                        // Check if task already exists for this student today
                        const today = new Date().toISOString().split('T')[0];
                        const existingTask = await Task.findOne({
                            where: {
                                userId: targetUser.id,
                                title: { [Op.like]: `%${student.name}%` },
                                description: { [Op.like]: '%risco%' },
                                dueDate: { [Op.gte]: today }
                            }
                        });

                        if (!existingTask) {
                            await Task.create({
                                title: `Risco de Desistência: ${student.name}`,
                                description: `O aluno faltou ${limit} vezes seguidas. Entrar em contato urgente.`,
                                dueDate: new Date(),
                                priority: 'high',
                                category: 'pedagogical',
                                userId: targetUser.id,
                                unitId: student.unitId
                            });
                        }
                    }
                }
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /pedagogical/students-mentorships
// List active students with their mentorship usage
router.get('/students-mentorships', auth, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const isGlobalUser = [1, 10].includes(Number(roleId));
        const where = { status: 'active' };
        if (!isGlobalUser && unitId) where.unitId = Number(unitId);

        const students = await Student.findAll({
            where,
            attributes: ['id', 'name', 'status'],
            include: [
                {
                    model: require('../models/Enrollment'),
                    include: [
                        {
                            model: Class,
                            include: [
                                { model: Course, attributes: ['name', 'mentorshipsIncluded'] },
                                { model: User, as: 'professor', attributes: ['id', 'name', 'canMentorship'] }
                            ]
                        }
                    ]
                },
                {
                    model: Mentorship,
                    required: false,
                    include: [{ model: User, as: 'mentor', attributes: ['id', 'name'] }]
                }
            ],
            order: [['name', 'ASC']]
        });

        // Format data
        const data = students.map(s => {
            const enrollment = s.Enrollments && s.Enrollments[0];
            const course = enrollment?.Class?.Course;
            const included = course?.mentorshipsIncluded || 0;
            const applied = s.Mentorships ? s.Mentorships.filter(m => m.status === 'completed').length : 0;
            const scheduled = s.Mentorships ? s.Mentorships.filter(m => m.status === 'scheduled').length : 0;

            return {
                id: s.id,
                name: s.name,
                courseName: course?.name || 'N/A',
                className: enrollment?.Class?.name || 'Sem Turma',
                professor: enrollment?.Class?.professor ? {
                    id: enrollment.Class.professor.id,
                    name: enrollment.Class.professor.name,
                    canMentorship: enrollment.Class.professor.canMentorship
                } : null,
                mentorshipsIncluded: included,
                mentorshipsApplied: applied,
                mentorshipsScheduled: scheduled,
                remaining: included - applied,
                mentorships: s.Mentorships
            };
        });

        res.json(data);
    } catch (error) {
        require('fs').appendFileSync('/Users/mendesarts/.gemini/antigravity/scratch/vox2you-system/error_log.txt', 'POST Error: ' + error.stack + '\n');
        console.error('POST Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /pedagogical/mentors
router.get('/mentors', auth, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const isGlobalUser = [1, 10].includes(Number(roleId));
        const where = { canMentorship: true, active: true };
        if (!isGlobalUser && unitId) where.unitId = unitId;

        const mentors = await User.findAll({
            where,
            attributes: ['id', 'name', 'roleId'],
            order: [['name', 'ASC']]
        });
        res.json(mentors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pedagogical/mentorship
router.post('/mentorship', auth, async (req, res) => {
    try {
        console.log('--- POST /mentorship ---');
        console.log('Body:', req.body);
        console.log('User:', req.user);
        const studentId = Number(req.body.studentId);
        const mentorId = req.body.mentorId ? Number(req.body.mentorId) : null;
        const { scheduledDate, notes, status } = req.body;

        if (isNaN(studentId)) return res.status(400).json({ error: 'ID de aluno inválido' });

        const student = await Student.findByPk(studentId);
        if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, student.unitId)) return;

        if (mentorId) {
            const mentor = await User.findByPk(mentorId);
            if (!mentor) return res.status(400).json({ error: 'Mentor não encontrado (ID inexistente)' });
            // Also check mentor unit isolation? Usually mentors are in same unit or global.
            if (!checkUnitIsolation(res, req.user, mentor.unitId)) return;
        }

        // Instructor cannot schedule (Only Leaders)
        if (Number(req.user.roleId) === ROLE_IDS.INSTRUCTOR) {
            return res.status(403).json({ error: 'Apenas a Liderança pode agendar mentorias.' });
        }

        const mentorship = await Mentorship.create({
            studentId,
            mentorId,
            scheduledDate,
            notes,
            status: status || 'scheduled'
        });

        res.status(201).json(mentorship);
    } catch (error) {
        const errorMsg = `POST Error: ${error.message}${error.parent ? ' | Parent: ' + error.parent.message : ''}\nStack: ${error.stack}\n`;
        require('fs').appendFileSync('/Users/mendesarts/.gemini/antigravity/scratch/vox2you-system/error_log.txt', errorMsg);
        res.status(500).json({ error: error.message });
    }
});

// PUT /pedagogical/mentorship/:id
router.put('/mentorship/:id', auth, async (req, res) => {
    try {
        console.log('--- PUT /mentorship/' + req.params.id + ' ---');
        console.log('Body:', req.body);
        const { status, notes, scheduledDate } = req.body;
        const mentorId = req.body.mentorId !== undefined ? (req.body.mentorId === null ? null : Number(req.body.mentorId)) : undefined;

        const mentorship = await Mentorship.findByPk(req.params.id, {
            include: [{ model: Student, attributes: ['unitId'] }]
        });
        if (!mentorship) {
            console.error('Mentorship not found:', req.params.id);
            return res.status(404).json({ error: 'Mentoria não encontrada' });
        }

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, mentorship.Student?.unitId)) return;

        if (mentorId !== undefined && mentorId !== null) {
            const mentor = await User.findByPk(mentorId);
            if (!mentor) return res.status(400).json({ error: 'Mentor não encontrado (ID inexistente)' });
        }

        await mentorship.update({
            status: status !== undefined ? status : mentorship.status,
            notes: notes !== undefined ? notes : mentorship.notes,
            scheduledDate: scheduledDate !== undefined ? scheduledDate : mentorship.scheduledDate,
            mentorId: mentorId !== undefined ? mentorId : mentorship.mentorId
        });

        res.json(mentorship);
    } catch (error) {
        const errorMsg = `PUT Error: ${error.message}${error.parent ? ' | Parent: ' + error.parent.message : ''}\nStack: ${error.stack}\n`;
        require('fs').appendFileSync('/Users/mendesarts/.gemini/antigravity/scratch/vox2you-system/error_log.txt', errorMsg);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /pedagogical/mentorship/:id
router.delete('/mentorship/:id', auth, async (req, res) => {
    try {
        console.log('--- DELETE /mentorship/' + req.params.id + ' ---');
        const mentorship = await Mentorship.findByPk(req.params.id, {
            include: [{ model: Student, attributes: ['unitId'] }]
        });
        if (!mentorship) return res.status(404).json({ error: 'Não encontrado' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, mentorship.Student?.unitId)) return;

        await mentorship.destroy();
        console.log('Deleted successfully');
        res.json({ message: 'Excluído' });
    } catch (error) {
        console.error('DELETE Error:', error);
        res.status(500).json({ error: error.message });
    }
});



// --- Data Tools Middleware ---
const checkDataToolsAccess = (req, res, next) => {
    // 1=Master, 10=Director, 20=Franchisee, 30=Manager, 40=Commercial Leader, 50=Pedagogical Leader, 60=Financial Admin
    const allowed = [1, 10, 20, 30, 40, 50, 60];
    if (!allowed.includes(Number(req.user.roleId))) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
};

// GET /pedagogical/export/csv
router.get('/export/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const where = {};
        if (Number(roleId) !== 1) where.unitId = Number(unitId);

        const students = await Student.findAll({ where, raw: true });

        const fields = ['name', 'email', 'mobile', 'cpf', 'status', 'createdAt'];
        let csv = fields.join(',') + '\n';

        students.forEach(s => {
            const row = fields.map(field => {
                let val = s[field] || '';
                if (field === 'createdAt') val = new Date(val).toLocaleDateString('pt-BR');
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('"')) val = `"${val}"`;
                return val;
            });
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`students_export_${new Date().getTime()}.csv`);
        res.send(csv);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pedagogical/import/csv
router.post('/import/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { csvContent } = req.body;
        const { unitId, roleId } = req.user;

        if (!csvContent) return res.status(400).json({ error: 'CSV Inválido' });

        const lines = csvContent.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        let success = 0;
        let failed = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            if (values.length < 2) { failed++; continue; }

            const data = {};
            headers.forEach((h, index) => {
                let val = values[index] ? values[index].trim() : '';
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                if (['name', 'email', 'mobile', 'cpf'].includes(h)) data[h] = val;
            });

            if (!data.name) { failed++; continue; }

            const exists = await Student.findOne({
                where: {
                    [Op.or]: [{ email: data.email || 'x' }, { cpf: data.cpf || 'y' }]
                }
            });

            if (!exists) {
                await Student.create({
                    ...data,
                    unitId: Number(roleId) === 1 ? (data.unitId || null) : Number(unitId),
                    status: 'active'
                });
                success++;
            } else {
                failed++;
            }
        }
        res.json({ message: 'Importado', success, failed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /pedagogical/student/:id/logs
router.get('/student/:id/logs', auth, async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, student.unitId)) return;

        const logs = await StudentLog.findAll({
            where: { studentId: req.params.id },
            order: [['date', 'DESC']],
            limit: 50
        });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pedagogical/transfer
router.post('/transfer', auth, async (req, res) => {
    try {
        const { studentId, toClassId, reason } = req.body;
        const student = await Student.findByPk(studentId);
        if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, student.unitId)) return;

        const fromClassId = student.classId;
        const oldClass = fromClassId ? await Class.findByPk(fromClassId) : null;
        const newClass = await Class.findByPk(toClassId);
        if (!newClass) return res.status(404).json({ error: 'Turma de destino não encontrada' });

        // 1. Perform Transfer
        await student.update({ classId: toClassId, courseId: newClass.courseId }); // Update course to match new class if needed

        await Transfer.create({
            studentId,
            fromClassId,
            toClassId,
            reason,
            status: 'completed'
        });

        const logMsg = `Transferido da turma ${oldClass ? oldClass.name : 'N/A'} para ${newClass.name}`;
        await addStudentLog(studentId, 'TRANSFER', logMsg, { fromClassId, toClassId, reason });

        // 2. Map history to future classes
        // Find all modules student already attended anywhere
        const attended = await Attendance.findAll({
            where: { studentId, present: true },
            attributes: ['moduleId']
        });
        const attendedModuleIds = new Set(attended.map(a => a.moduleId).filter(id => id));

        if (attendedModuleIds.size > 0) {
            // Find class sessions in the NEW class for these modules that are in the FUTURE
            const today = new Date().toISOString().split('T')[0];
            const futureSessions = await ClassSession.findAll({
                where: {
                    classId: toClassId,
                    moduleId: { [Op.in]: Array.from(attendedModuleIds) },
                    date: { [Op.gte]: today }
                }
            });

            for (const session of futureSessions) {
                // Auto-mark as present so they don't have to watch again
                await Attendance.findOrCreate({
                    where: { studentId, classId: toClassId, moduleId: session.moduleId, date: session.date },
                    defaults: { present: true }
                });
                await addStudentLog(studentId, 'AUTO_ATTENDANCE', `Presença marcada automaticamente (Aula já assistida anteriormente): ${session.date}`, { moduleId: session.moduleId });
            }
        }

        res.json({ success: true, message: 'Transferência concluída com mapeamento de histórico.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /pedagogical/transfer-unit
router.post('/transfer-unit', auth, async (req, res) => {
    try {
        const { studentId, destinationUnitId, reason } = req.body;
        const student = await Student.findByPk(studentId);
        if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, student.unitId)) return;

        const originUnitId = student.unitId;
        const originUnit = originUnitId ? await Unit.findByPk(originUnitId) : null;
        const targetUnit = await Unit.findByPk(destinationUnitId);
        if (!targetUnit) return res.status(404).json({ error: 'Unidade de destino não encontrada' });

        const fromClassId = student.classId;
        const oldClass = fromClassId ? await Class.findByPk(fromClassId) : null;

        // 1. Log the transfer
        const logMsg = `Transferido da unidade ${originUnit ? originUnit.name : 'Geral'} para ${targetUnit.name}`;
        await addStudentLog(studentId, 'UNIT_TRANSFER', logMsg, { originUnitId, destinationUnitId, reason, fromClassId });

        // 2. Perform Transfer: Clear classId (since it belongs to old unit) and update unitId
        await student.update({
            unitId: destinationUnitId,
            classId: null, // Force re-enrollment in the new unit
            courseId: student.courseId // Keep course
        });

        await Transfer.create({
            studentId,
            originUnitId,
            destinationUnitId,
            fromClassId,
            type: 'unit_transfer',
            reason,
            status: 'completed'
        });

        res.json({ success: true, message: 'Transferência de unidade concluída. O aluno agora pertence à unidade ' + targetUnit.name });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
