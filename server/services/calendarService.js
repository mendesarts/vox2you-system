const { Op } = require('sequelize');
const UserAvailability = require('../models/UserAvailability');
const CalendarBlock = require('../models/CalendarBlock');
const Task = require('../models/Task');
const Lead = require('../models/Lead');

const getFreeSlots = async (userId, dateString) => {
    // dateString format: 'YYYY-MM-DD'
    const date = new Date(dateString);
    const dayOfWeek = date.getDay(); // 0 (Sun) - 6 (Sat)

    // 1. Get Standard Availability
    const availability = await UserAvailability.findOne({
        where: { userId, dayOfWeek }
    });

    if (!availability) {
        return []; // Closed today
    }

    // Parse times (HH:MM:SS)
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);

    const workStart = new Date(date);
    workStart.setHours(startH, startM, 0, 0);

    const workEnd = new Date(date);
    workEnd.setHours(endH, endM, 0, 0);

    // 2. Get Blocks (CalendarBlocks)
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const blocks = await CalendarBlock.findAll({
        where: {
            userId,
            [Op.or]: [
                { startTime: { [Op.between]: [dayStart, dayEnd] } },
                { endTime: { [Op.between]: [dayStart, dayEnd] } }
            ]
        }
    });

    // 3. Get Appointments (Leads & Tasks)
    const leads = await Lead.findAll({
        where: {
            consultantId: userId, // Assuming consultantId matches userId
            appointmentDate: { [Op.between]: [dayStart, dayEnd] }
        }
    });

    const tasks = await Task.findAll({
        where: {
            userId,
            dueDate: { [Op.between]: [dayStart, dayEnd] },
            // Filter by type if needed, e.g., 'meeting' vs just 'todo'
            // For now, assuming all timed tasks block calendar if specific time set?
            // Or maybe only those with 'meeting' in title? 
            // Let's assume tasks with specific time are blocks.
        }
    });

    // Combine all busy intervals
    let busyIntervals = [];

    // Blocks
    blocks.forEach(b => {
        busyIntervals.push({ start: b.startTime, end: b.endTime });
    });

    // Leads (Appointments - assume 1 hour duration default)
    leads.forEach(l => {
        if (l.appointmentDate) {
            const start = new Date(l.appointmentDate);
            const end = new Date(start.getTime() + 60 * 60 * 1000); // 1h
            busyIntervals.push({ start, end });
        }
    });

    // Tasks (Assume 30 mins default if just a point in time)
    tasks.forEach(t => {
        if (t.dueDate) {
            const start = new Date(t.dueDate);
            const end = new Date(start.getTime() + 30 * 60 * 1000); // 30m
            busyIntervals.push({ start, end });
        }
    });

    // Sort intervals
    busyIntervals.sort((a, b) => a.start - b.start);

    // Generate Slots (e.g. 1 hour slots)
    const slotDuration = 60 * 60 * 1000; // 1 hour
    let slots = [];
    let current = workStart.getTime();
    const endLimit = workEnd.getTime();

    while (current + slotDuration <= endLimit) {
        const slotStart = current;
        const slotEnd = current + slotDuration;

        // Check collision
        const isBusy = busyIntervals.some(interval => {
            const iStart = interval.start.getTime();
            const iEnd = interval.end.getTime();
            return (slotStart < iEnd && slotEnd > iStart); // Overlap logic
        });

        if (!isBusy) {
            slots.push(new Date(slotStart).toTimeString().substring(0, 5));
        }

        current += slotDuration; // Step 1 hour
        // Alternatively, current += 30 * 60 * 1000 for 30 min steps 
    }

    return slots;
};

module.exports = { getFreeSlots };
