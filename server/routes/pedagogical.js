const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const Mentorship = require('../models/Mentorship');
const User = require('../models/User');

// GET /pedagogical/stats
router.get('/stats', async (req, res) => {
    try {
        // Active Students
        const activeStudents = await Student.count({ where: { status: 'active' } });

        // Active Classes
        const activeClasses = await Class.count({ where: { status: 'active' } });

        // Month Dates
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Mentorships Stats
        const mentorshipsMonthScheduled = await Mentorship.count({
            where: {
                status: 'scheduled',
                scheduledDate: { [Op.between]: [startOfMonth, endOfMonth] }
            }
        });
        const mentorshipsMonthCompleted = await Mentorship.count({
            where: {
                status: 'completed', // Assuming 'completed' is the status for done
                scheduledDate: { [Op.between]: [startOfMonth, endOfMonth] }
            }
        });

        // Student Stats
        const lockedStudents = await Student.count({ where: { status: 'locked' } });
        const graduatedStudents = await Student.count({ where: { status: 'completed' } });
        const totalStudents = await Student.count();

        // Attendance Average (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendances = await Attendance.findAll({
            where: {
                date: { [Op.gte]: thirtyDaysAgo }
            }
        });

        let attendanceRate = 0;
        if (attendances.length > 0) {
            const presenceCount = attendances.filter(a => a.present).length;
            attendanceRate = ((presenceCount / attendances.length) * 100).toFixed(1);
        }

        const atRisk = 0; // TODO: Implement atRisk Calculation

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

// POST /pedagogical/attendance
router.post('/attendance', async (req, res) => {
    try {
        const { studentId, classId, date, present } = req.body;

        const existing = await Attendance.findOne({
            where: { studentId, classId, date: new Date(date) }
        });

        if (existing) {
            await existing.update({ present });
        } else {
            await Attendance.create({
                studentId,
                classId,
                date: new Date(date),
                present
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /pedagogical/students-mentorships
// List active students with their mentorship usage
router.get('/students-mentorships', async (req, res) => {
    try {
        const students = await Student.findAll({
            where: { status: 'active' },
            attributes: ['id', 'name', 'status'],
            include: [
                {
                    model: require('../models/Enrollment'),
                    include: [
                        {
                            model: Class,
                            include: [{ model: Course, attributes: ['name', 'mentorshipsIncluded'] }]
                        }
                    ]
                },
                {
                    model: Mentorship,
                    required: false
                }
            ],
            order: [['name', 'ASC']]
        });

        // Format data
        const data = students.map(s => {
            const enrollment = s.Enrollments && s.Enrollments[0]; // Assuming latest enrollment
            const course = enrollment?.Class?.Course;
            const included = course?.mentorshipsIncluded || 0;
            const applied = s.Mentorships ? s.Mentorships.filter(m => m.status === 'completed').length : 0;
            const scheduled = s.Mentorships ? s.Mentorships.filter(m => m.status === 'scheduled').length : 0;

            return {
                id: s.id,
                name: s.name,
                courseName: course?.name || 'N/A',
                className: enrollment?.Class?.name || 'Sem Turma',
                mentorshipsIncluded: included,
                mentorshipsApplied: applied,
                mentorshipsScheduled: scheduled,
                remaining: included - applied,
                mentorships: s.Mentorships
            };
        });

        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /pedagogical/mentorship
router.post('/mentorship', async (req, res) => {
    try {
        const { studentId, scheduledDate, notes, status } = req.body;

        const mentorship = await Mentorship.create({
            studentId,
            scheduledDate,
            notes,
            status: status || 'scheduled'
        });

        res.status(201).json(mentorship);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /pedagogical/mentorship/:id
router.put('/mentorship/:id', async (req, res) => {
    try {
        const { status, notes, scheduledDate } = req.body;
        const mentorship = await Mentorship.findByPk(req.params.id);

        if (!mentorship) return res.status(404).json({ error: 'Mentoria não encontrada' });

        await mentorship.update({
            status: status || mentorship.status,
            notes: notes !== undefined ? notes : mentorship.notes,
            scheduledDate: scheduledDate || mentorship.scheduledDate
        });

        res.json(mentorship);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const auth = require('../middleware/auth');

// --- Data Tools Middleware ---
const checkDataToolsAccess = (req, res, next) => {
    const allowed = ['master', 'franchisee', 'manager', 'admin', 'sales_leader', 'pedagogical_leader', 'admin_financial_manager'];
    if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
};

// GET /pedagogical/export/csv
router.get('/export/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { unitId, role } = req.user;
        const where = {};
        if (role !== 'master') where.unitId = unitId;

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
        const { unitId, role } = req.user;

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
                    unitId: role === 'master' ? null : unitId,
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

module.exports = router;
