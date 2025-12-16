const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const CalendarBlock = require('../models/CalendarBlock');
const UserAvailability = require('../models/UserAvailability');

// GET /api/calendar/events
router.get('/events', auth, async (req, res) => {
    try {
        const { start, end } = req.query; // ISO Date Strings
        const userId = req.user.id;

        // Scope: User's own calendar (unless master checking others? Let's stick to personal/unit view later)
        // For now, simple personal calendar.

        const startDate = start ? new Date(start) : new Date();
        const endDate = end ? new Date(end) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        // 1. Appointments (Leads)
        const leads = await Lead.findAll({
            where: {
                consultantId: userId,
                appointmentDate: { [Op.between]: [startDate, endDate] },
                status: 'scheduled'
            }
        });

        // 2. Tasks
        const tasks = await Task.findAll({
            where: {
                userId: userId,
                dueDate: { [Op.between]: [startDate, endDate] }
            }
        });

        // 3. Manual Blocks
        const blocks = await CalendarBlock.findAll({
            where: {
                userId: userId,
                startTime: { [Op.gte]: startDate }, // Simplified overlap logic
                endTime: { [Op.lte]: endDate }
            }
        });

        // Normalize Data for Frontend
        // Type: 'appointment', 'task', 'block'
        const events = [];

        leads.forEach(l => {
            events.push({
                id: `lead_${l.id}`,
                title: `Reunião: ${l.name}`,
                start: l.appointmentDate,
                end: new Date(new Date(l.appointmentDate).getTime() + 60 * 60 * 1000), // Assume 1h
                type: 'appointment',
                data: l
            });
        });

        tasks.forEach(t => {
            events.push({
                id: `task_${t.id}`,
                title: `Tarefa: ${t.title}`,
                start: t.dueDate,
                end: new Date(new Date(t.dueDate).getTime() + 30 * 60 * 1000), // Assume 30m
                type: 'task',
                data: t
            });
        });

        blocks.forEach(b => {
            events.push({
                id: `block_${b.id}`,
                title: `Bloqueio: ${b.reason || 'Ocupado'}`,
                start: b.startTime,
                end: b.endTime,
                type: 'block',
                data: b
            });
        });

        res.json(events);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/calendar/blocks
router.post('/blocks', auth, async (req, res) => {
    try {
        const { startTime, endTime, reason } = req.body;
        const block = await CalendarBlock.create({
            userId: req.user.id,
            startTime,
            endTime,
            reason
        });
        res.json(block);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/calendar/blocks/:id
router.delete('/blocks/:id', auth, async (req, res) => {
    try {
        const block = await CalendarBlock.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!block) return res.status(404).json({ error: 'Block not found' });
        await block.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
