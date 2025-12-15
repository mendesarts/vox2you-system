import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Filter, Layers } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import './calendar.css';

const CalendarPage = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Get allowed types based on role
    const getAllowedTypes = () => {
        const role = user?.role;
        if (!role) return ['sessions', 'holidays']; // Default safe
        if (['admin', 'sales_leader', 'franqueado', 'manager'].includes(role)) return ['sessions', 'mentorships', 'crm', 'financial', 'holidays'];
        if (role === 'pedagogical') return ['sessions', 'mentorships', 'holidays'];
        if (role === 'consultant') return ['crm', 'sessions', 'holidays'];
        if (role === 'admin_staff') return ['financial', 'sessions', 'holidays'];
        return ['sessions', 'holidays'];
    };

    const allowedTypes = getAllowedTypes();

    // Data States
    const [events, setEvents] = useState({
        sessions: [],
        holidays: [],
        mentorships: [],
        crm: [],
        financial: []
    });

    // Filter States
    const [visibleTypes, setVisibleTypes] = useState({
        sessions: true,
        holidays: true,
        mentorships: true,
        crm: true,
        financial: true
    });

    useEffect(() => {
        fetchAllData();
    }, [currentMonth]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [resSessions, resHolidays, resMentorships, resCRM, resFinancial] = await Promise.all([
                fetch('http://localhost:3000/api/calendar/sessions'),
                fetch('http://localhost:3000/api/calendar/holidays'),
                fetch('http://localhost:3000/api/calendar/mentorships'),
                fetch('http://localhost:3000/api/calendar/crm'),
                fetch('http://localhost:3000/api/calendar/financial')
            ]);

            const holidaysRaw = await resHolidays.json();

            const newEvents = {
                sessions: await resSessions.json(),
                holidays: holidaysRaw.map(h => ({
                    id: `h-${h.id}`,
                    title: h.name,
                    start: h.startDate,
                    end: h.endDate || h.startDate,
                    type: 'holiday'
                })),
                mentorships: await resMentorships.json(),
                crm: await resCRM.json(),
                financial: await resFinancial.json()
            };

            setEvents(newEvents);
        } catch (error) {
            console.error("Error fetching calendar data", error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    const toggleFilter = (type) => {
        setVisibleTypes(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleEventClick = (event) => {
        if (event.type === 'session') {
            navigate('/pedagogical', { state: { subTab: 'attendance' } });
        } else if (event.type === 'mentorship') {
            navigate('/pedagogical', { state: { subTab: 'mentorships' } });
        } else if (event.type === 'crm') {
            navigate('/crm');
        } else if (event.type === 'financial') {
            navigate('/administrative', { state: { tab: 'financial' } });
        }
    };

    // Helper to flatten visible events for a specific day
    const getEventsForDay = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        let dayEvents = [];

        if (visibleTypes.holidays) {
            dayEvents = dayEvents.concat(events.holidays.filter(h =>
                dateStr >= h.start && dateStr <= h.end
            ));
        }
        if (visibleTypes.sessions) {
            dayEvents = dayEvents.concat(events.sessions.filter(s => s.start.startsWith(dateStr)));
        }
        if (visibleTypes.mentorships) {
            dayEvents = dayEvents.concat(events.mentorships.filter(m => m.start.startsWith(dateStr)));
        }
        if (visibleTypes.crm) {
            dayEvents = dayEvents.concat(events.crm.filter(c => c.start.startsWith(dateStr)));
        }
        if (visibleTypes.financial) {
            dayEvents = dayEvents.concat(events.financial.filter(f => f.start === dateStr));
        }

        return dayEvents;
    };

    const renderHeader = () => {
        const dateFormat = "MMMM yyyy";
        return (
            <div className="calendar-controls">
                <button className="icon-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
                <span style={{ textTransform: 'capitalize', width: '150px', textAlign: 'center', fontWeight: 600, fontSize: '1.2rem' }}>
                    {format(currentMonth, dateFormat, { locale: ptBR })}
                </span>
                <button className="icon-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
                <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 10px' }}></div>
                <button className="btn-today" onClick={goToToday}>Hoje</button>
            </div>
        );
    };

    const renderFilters = () => (
        <div style={{ display: 'flex', gap: '10px', padding: '10px 0', flexWrap: 'wrap' }}>
            {allowedTypes.includes('sessions') && <FilterButton label="Aulas" color="#8b5cf6" active={visibleTypes.sessions} onClick={() => toggleFilter('sessions')} />}
            {allowedTypes.includes('mentorships') && <FilterButton label="Mentorias" color="#10b981" active={visibleTypes.mentorships} onClick={() => toggleFilter('mentorships')} />}
            {allowedTypes.includes('crm') && <FilterButton label="CRM" color="#f59e0b" active={visibleTypes.crm} onClick={() => toggleFilter('crm')} />}
            {allowedTypes.includes('financial') && <FilterButton label="Financeiro" color="#3b82f6" active={visibleTypes.financial} onClick={() => toggleFilter('financial')} />}
            {allowedTypes.includes('holidays') && <FilterButton label="Feriados" color="#ec4899" active={visibleTypes.holidays} onClick={() => toggleFilter('holidays')} />}
        </div>
    );

    const FilterButton = ({ label, color, active, onClick }) => (
        <button
            onClick={onClick}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px',
                border: `1px solid ${active ? color : 'var(--border)'}`,
                background: active ? `${color}20` : 'transparent',
                color: active ? color : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                transition: 'all 0.2s'
            }}
        >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, opacity: active ? 1 : 0.5 }}></div>
            {label}
        </button>
    );

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const allCells = [];
        let day = startDate;

        while (day <= endDate) {
            const dayData = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const formattedDate = format(day, "d");

            allCells.push(
                <div
                    className={`day-cell ${!isCurrentMonth ? "disabled" : isSameDay(day, new Date()) ? "today" : ""}`}
                    key={day.toString()}
                >
                    <span className="day-number">{formattedDate}</span>
                    <div className="events-container">
                        {dayData.map((event, idx) => (
                            <EventItem
                                key={`${event.id}-${idx}`}
                                event={event}
                                onClick={() => handleEventClick(event)}
                            />
                        ))}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }

        return <div className="calendar-content">{allCells}</div>;
    };

    const EventItem = ({ event, onClick }) => {
        let style = {
            borderLeft: '4px solid',
            fontSize: '0.75rem',
            padding: '4px 6px',
            marginBottom: '4px',
            borderRadius: '4px',
            background: 'var(--bg-surface)',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            lineHeight: '1.2'
        };

        // Colors
        if (event.type === 'session') { style.borderColor = '#8b5cf6'; style.background = '#8b5cf615'; }
        if (event.type === 'mentorship') { style.borderColor = '#10b981'; style.background = '#10b98115'; }
        if (event.type === 'crm') { style.borderColor = '#f59e0b'; style.background = '#f59e0b15'; }
        if (event.type === 'financial') { style.borderColor = event.color; style.background = event.color + '15'; }
        if (event.type === 'holiday') { style.borderColor = '#ec4899'; style.background = '#ec489915'; style.fontWeight = 'bold'; }

        const time = event.start.includes('T') ? event.start.split('T')[1].substring(0, 5) : null;

        return (
            <div style={style} title={event.title} onClick={(e) => { e.stopPropagation(); onClick && onClick(); }}>
                {time && <span style={{ marginRight: '4px', opacity: 0.8, fontWeight: 'bold' }}>{time}</span>}
                {event.title}
            </div>
        );
    };

    return (
        <div className="calendar-page page-fade-in">
            <header className="page-header" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 className="page-title">Calendário</h2>
                        </div>
                        <p className="page-subtitle">Visão geral de todas as atividades.</p>
                    </div>
                    {renderHeader()}
                </div>
                {renderFilters()}
            </header>

            <div className="calendar-grid-wrapper">
                <div className="days-header">
                    {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                        <div key={d} className="col-header">{d}</div>
                    ))}
                </div>
                {renderCells()}
            </div>
        </div>
    );
};

export default CalendarPage;
