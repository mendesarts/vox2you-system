const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');

// POST /enrollments - Criar matrícula
router.post('/', async (req, res) => {
    try {
        const { studentId, classId, courseId } = req.body;
        const enrollment = await Enrollment.create({
            studentId,
            classId,
            status: 'active',
            enrollmentDate: new Date()
        });

        // Update Student status and current class link
        await Student.update({
            status: 'active',
            classId: classId,
            courseId: courseId
        }, { where: { id: studentId } });

        res.status(201).json(enrollment);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
