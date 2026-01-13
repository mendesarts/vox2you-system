const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const StudentLog = require('../models/StudentLog');
const Class = require('../models/Class');

const auth = require('../middleware/auth');

// POST /enrollments - Criar matrícula
router.post('/', auth, async (req, res) => {
    try {
        const { studentId, classId, courseId } = req.body;
        const { unitId } = req.user;

        const enrollment = await Enrollment.create({
            studentId,
            classId,
            courseId,
            status: 'active',
            enrollmentDate: new Date(),
            unitId: req.user.role === 'master' ? (req.body.unitId || null) : unitId
        });

        const selectedClass = await Class.findByPk(classId);

        // Update Student status and current class link
        await Student.update({
            status: 'active',
            classId: classId,
            courseId: courseId
        }, { where: { id: studentId } });

        // Add Log
        await StudentLog.create({
            studentId,
            action: 'ENROLLMENT',
            description: `Matriculado na turma ${selectedClass ? selectedClass.name : 'N/A'}`
        });

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
