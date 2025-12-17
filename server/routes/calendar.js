const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const CalendarBlock = require('../models/CalendarBlock');
const UserAvailability = require('../models/UserAvailability');
const Holiday = require('../models/Holiday');

// --- HOLIDAYS ENDPOINTS ---
// GET /api/calendar/holidays
router.get('/holidays', auth, async (req, res) => {
    try {
        const { unitId } = req.user;
        const holidays = await Holiday.findAll({
            where: {
                [Op.or]: [
                    { unitId: unitId }, // Feriados Locais
                    { unitId: null }    // Feriados Nacionais (Global)
                ]
            },
            order: [['startDate', 'ASC']]
        });
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/calendar/holidays (Local/Recess only)
router.post('/holidays', auth, async (req, res) => {
    try {
        const { name, startDate, endDate, type } = req.body;
        // Force unitId from creator (Local)
        const holiday = await Holiday.create({
            name,
            startDate,
            endDate: endDate || startDate,
            type: type || 'holiday',
            unitId: req.user.unitId
        });
        res.json(holiday);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/calendar/holidays/:id
router.delete('/holidays/:id', auth, async (req, res) => {
    try {
        // Can only delete if it belongs to user's unit (can't delete National default)
        const holiday = await Holiday.findOne({
            where: {
                id: req.params.id,
                unitId: req.user.unitId // Security Check
            }
        });

        if (!holiday) {
            // Check if it exists but is global
            const global = await Holiday.findByPk(req.params.id);
            if (global && !global.unitId) {
                return res.status(403).json({ error: 'Não é possível remover Feriados Nacionais.' });
            }
            return res.status(404).json({ error: 'Feriado não encontrado ou sem permissão.' });
        }

        await holiday.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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

        // 3. Holidays
        const { unitId } = req.user; // Ensure unitId is available (might be undefined if basic auth used, but middleware sets it)
        const holidays = await Holiday.findAll({
            where: {
                [Op.or]: [{ unitId: unitId }, { unitId: null }],
                startDate: { [Op.between]: [startDate, endDate] }
            }
        });

        holidays.forEach(h => {
            // Force time for display in day grid
            const startT = `${h.startDate}T08:00:00`;
            const endT = `${h.endDate}T18:00:00`;
            events.push({
                id: `holiday_${h.id}`,
                title: `Feriado: ${h.name}`,
                start: startT,
                end: endT,
                type: 'holiday',
                data: h,
                isAllDay: true
            });
        });

        // 4. Manual Blocks
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
