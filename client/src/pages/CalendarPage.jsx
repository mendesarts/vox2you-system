import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, MoreHorizontal, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/calendar.css';

const WORK_START = 8; // 8 AM
const WORK_END = 20; // 8 PM
const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CalendarPage = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', reason: '' });

    // Navigate Weeks
    const nextWeek = () => {
        const next = new Date(currentDate);
        next.setDate(next.getDate() + 7);
        setCurrentDate(next);
    };

    const prevWeek = () => {
        const prev = new Date(currentDate);
        prev.setDate(prev.getDate() - 7);
        setCurrentDate(prev);
    };

    // Get current week range
    const getWeekRange = () => {
        const curr = new Date(currentDate);
        const day = curr.getDay(); // 0-6
        // Set to Sunday of this week
        const first = curr.getDate() - day;

        const start = new Date(curr.setDate(first));
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    useEffect(() => {
        fetchEvents();
    }, [currentDate]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { start, end } = getWeekRange();
            const token = localStorage.getItem('token');
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

            // Parallel fetch
            const [eventsRes, holidaysRes] = await Promise.all([
                fetch(`${apiBase}/calendar/events?start=${start.toISOString()}&end=${end.toISOString()}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${apiBase}/calendar/holidays`)
            ]);

            const eventsData = eventsRes.ok ? await eventsRes.json() : [];
            const holidaysData = holidaysRes.ok ? await holidaysRes.json() : [];

            // Map holidays to event structure
            const mappedHolidays = Array.isArray(holidaysData) ? holidaysData.map(h => ({
                id: `holiday-${h.id}`,
                title: `🇧🇷 ${h.name}`,
                start: `${h.startDate}T00:00:00`,
                end: `${h.startDate}T23:59:59`,
                type: 'holiday', // Needs CSS for this
                allDay: true
            })) : [];

            // Ensure eventsData is array
            const validEvents = Array.isArray(eventsData) ? eventsData : [];

            setEvents([...validEvents, ...mappedHolidays]);
        } catch (error) {
            console.error("Calendar fetch error:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBlock = async () => {
        if (!newBlock.date || !newBlock.startTime || !newBlock.endTime || !newBlock.reason) {
            alert("Preencha todos os campos");
            return;
        }

        try {
            // Combine Date + Time
            const start = new Date(`${newBlock.date}T${newBlock.startTime}:00`);
            const end = new Date(`${newBlock.date}T${newBlock.endTime}:00`);

            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/blocks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ startTime: start, endTime: end, reason: newBlock.reason })
            });

            if (res.ok) {
                setShowBlockModal(false);
                setNewBlock({ date: '', startTime: '', endTime: '', reason: '' });
                fetchEvents();
            } else {
                alert("Erro ao criar bloqueio.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Helpers to render grid
    const weekStart = getWeekRange().start;
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
    });

    // Determine event position
    const getEventStyle = (event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Handle All Day (Holidays)
        if (event.allDay) {
            return {
                top: '0px',
                height: '24px',
                left: '2px',
                right: '2px',
                zIndex: 20,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fca5a5',
                fontSize: '0.75rem'
            };
        }

        // Vertical Position (Time)
        // Relative to WORK_START (e.g. 8am)
        // Each hour = 60px height
        const startHour = start.getHours() + (start.getMinutes() / 60);
        const endHour = end.getHours() + (end.getMinutes() / 60);

        const top = (startHour - WORK_START) * 60;
        const height = Math.max((endHour - startHour) * 60, 25); // Min height 25px

        // Determine weekday overlap if needed? 
        // We render separate columns, so we just check "is this event in this day?"

        return {
            top: `${top}px`,
            height: `${height}px`,
            left: '4px',
            right: '4px'
        };
    };

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="calendar-page page-fade-in">
            {/* Header */}
            <div className="calendar-header">
                <div>
                    <h2 className="page-title">Minha Agenda</h2>
                    <p className="page-subtitle">Gerencie compromissos, tarefas e horários de bloqueio.</p>
                </div>

                <div className="calendar-controls">
                    <button className="nav-btn" onClick={prevWeek}><ChevronLeft size={20} /></button>
                    <span className="current-date-label">
                        {weekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                    <button className="nav-btn" onClick={nextWeek}><ChevronRight size={20} /></button>

                    <button className="btn-primary" style={{ marginLeft: '16px' }} onClick={() => setShowBlockModal(true)}>
                        <Plus size={18} /> Novo Bloqueio
                    </button>
                    <div className="btn-secondary" style={{ pointerEvents: 'none', background: '#f1f5f9', border: 'none' }}>
                        Hoje: {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-container">
                {/* Time Column */}
                <div className="time-column">
                    <div className="time-header-cell"></div>
                    {Array.from({ length: WORK_END - WORK_START + 1 }, (_, i) => (
                        <div key={i} className="time-slot-label">
                            {WORK_START + i}:00
                        </div>
                    ))}
                </div>

                {/* Days Columns */}
                <div className="days-grid">
                    {weekDays.map((day, dayIndex) => {
                        const isToday = new Date().toDateString() === day.toDateString();

                        // Filter events for this day
                        const dayEvents = events.filter(ev => {
                            if (!ev.start || !ev.end) return false;
                            const eDate = new Date(ev.start);
                            const endDate = new Date(ev.end);
                            return !isNaN(eDate) && !isNaN(endDate) && eDate.toDateString() === day.toDateString();
                        });

                        return (
                            <div key={dayIndex} className={`day-column ${isToday ? 'today' : ''}`}>
                                <div className="day-header">
                                    <span className="day-name">{DAYS_OF_WEEK[day.getDay()]}</span>
                                    <span className="day-number">{day.getDate()}</span>
                                </div>

                                <div className="day-slots-container">
                                    {/* Grid Lines for Hours */}
                                    {Array.from({ length: WORK_END - WORK_START }, (_, i) => (
                                        <div key={i} className="hour-guide" style={{ top: `${i * 60}px` }}></div>
                                    ))}

                                    {/* Events */}
                                    {dayEvents.map(ev => (
                                        <div
                                            key={ev.id}
                                            className={`calendar-event type-${ev.type}`}
                                            style={getEventStyle(ev)}
                                            title={`${ev.title} (${new Date(ev.start).toLocaleTimeString().slice(0, 5)} - ${new Date(ev.end).toLocaleTimeString().slice(0, 5)})`}
                                        >
                                            <div className="event-time">{new Date(ev.start).toLocaleTimeString().slice(0, 5)}</div>
                                            <div className="event-title">{ev.title}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal for Manual Block */}
            {showBlockModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Bloquear Horário</h3>
                            <button onClick={() => setShowBlockModal(false)}><MoreHorizontal size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Data</label>
                                <input type="date" value={newBlock.date} onChange={e => setNewBlock({ ...newBlock, date: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Início</label>
                                    <input type="time" value={newBlock.startTime} onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Fim</label>
                                    <input type="time" value={newBlock.endTime} onChange={e => setNewBlock({ ...newBlock, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Motivo</label>
                                <input type="text" placeholder="Ex: Almoço, Intervalo" value={newBlock.reason} onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })} />
                            </div>
                            <button className="btn-primary" onClick={handleCreateBlock} style={{ width: '100%', marginTop: '16px' }}>Criar Bloqueio</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarPage;
