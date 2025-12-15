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

module.exports = router;
