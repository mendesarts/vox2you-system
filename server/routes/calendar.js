const express = require('express');
const router = express.Router();
const Holiday = require('../models/Holiday');
const ClassSession = require('../models/ClassSession');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Mentorship = require('../models/Mentorship');
const Lead = require('../models/Lead');
const FinancialRecord = require('../models/FinancialRecord');
const Student = require('../models/Student');
const { Op } = require('sequelize');

// GET /calendar/holidays
router.get('/holidays', async (req, res) => {
    try {
        const holidays = await Holiday.findAll({ order: [['startDate', 'ASC']] });
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /calendar/holidays
router.post('/holidays', async (req, res) => {
    try {
        const holiday = await Holiday.create(req.body);
        res.status(201).json(holiday);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /calendar/holidays/:id
router.delete('/holidays/:id', async (req, res) => {
    try {
        const holiday = await Holiday.findByPk(req.params.id);
        if (!holiday) return res.status(404).json({ error: 'Feriado não encontrado' });
        await holiday.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /calendar/sessions
router.get('/sessions', async (req, res) => {
    try {
        const sessions = await ClassSession.findAll({
            include: [
                { model: Class, include: [Course] },
                { model: Module }
            ]
        });

        const events = sessions.map(session => ({
            id: `s-${session.id}`,
            title: `${session.Module?.title || 'Aula sem título'} (${session.Class?.name})`,
            start: `${session.date}T${session.startTime}`,
            type: 'session',
            extendedProps: {
                moduleTitle: session.Module?.title,
                moduleOrder: session.Module?.order,
                className: session.Class?.name,
                classNumber: session.Class?.classNumber,
                courseName: session.Class?.Course?.name
            }
        }));
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /calendar/mentorships
router.get('/mentorships', async (req, res) => {
    try {
        const mentorships = await Mentorship.findAll({
            // where: { status: 'scheduled' }, // Show all or just scheduled? Calendar usually shows all scheduled.
            include: [{ model: Student, attributes: ['name'] }]
        });

        const events = mentorships.map(m => ({
            id: `m-${m.id}`,
            title: `Mentoria: ${m.Student?.name || 'Aluno'}`,
            start: m.scheduledDate, // DateTime
            type: 'mentorship',
            color: '#10b981', // green
            extendedProps: {
                status: m.status,
                notes: m.notes
            }
        }));
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /calendar/crm
router.get('/crm', async (req, res) => {
    try {
        const leads = await Lead.findAll({
            where: {
                scheduledAt: { [Op.ne]: null }
            }
        });

        const events = leads.map(l => ({
            id: `c-${l.id}`,
            title: `CRM: ${l.name}`,
            start: l.scheduledAt,
            type: 'crm',
            color: '#f59e0b', // orange
            extendedProps: {
                desc: l.scheduledDesc,
                phone: l.phone
            }
        }));
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /calendar/financial
router.get('/financial', async (req, res) => {
    try {
        const records = await FinancialRecord.findAll({
            where: {
                dueDate: { [Op.ne]: null },
                status: 'pending' // Only show pending bills/invoices? Or all? Usually pending.
            }
        });

        const events = records.map(r => ({
            id: `f-${r.id}`,
            title: `${r.type === 'income' ? 'Receber' : 'Pagar'}: R$ ${r.amount}`,
            start: r.dueDate, // DateOnly usually
            type: 'financial',
            color: r.type === 'income' ? '#3b82f6' : '#ef4444',
            allDay: true
        }));
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
