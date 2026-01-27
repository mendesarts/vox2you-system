import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    MoreHorizontal,
    Plus,
    Trash2,
    Download,
    Flag,
    Sparkles,
    RefreshCw,
    Settings,
    Layout,
    Pencil,
    Briefcase,
    StickyNote,
    Phone,
    User,
    MessageSquare,
    Clock,
    Filter,
    CheckSquare,
    Minus,
    TrendingUp,
    TrendingDown,
    Wallet,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/roles';
import { getRoleName } from '../utils/roleLabel';
import Toast from '../components/Toast';
import { VoxModal } from '../components/VoxUI';
import '../styles/calendar.css';

const parseLocalDate = (dateInput) => {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return new Date(dateInput);
    if (typeof dateInput === 'string') {
        // If it has time info (ISO), parse fully to preserve Time
        if (dateInput.includes('T') && dateInput.length > 10) {
            return new Date(dateInput);
        }
        // Fallback for Date-Only strings (YYYY-MM-DD) -> Local Midnight
        if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
            const [y, m, d] = dateInput.split('T')[0].split('-').map(Number);
            return new Date(y, m - 1, d);
        }
    }
    return new Date(dateInput);
};

// --- CONSTANTS ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const FIXED_HOLIDAYS = [
    { day: 1, month: 0, name: 'Confraternização Universal' },
    { day: 21, month: 3, name: 'Tiradentes' },
    { day: 1, month: 4, name: 'Dia do Trabalho' },
    { day: 7, month: 8, name: 'Independência do Brasil' },
    { day: 12, month: 9, name: 'Nossa Sr.ª Aparecida' },
    { day: 2, month: 10, name: 'Finados' },
    { day: 15, month: 10, name: 'Proclamação da República' },
    { day: 20, month: 10, name: 'Consciência Negra' },
    { day: 25, month: 11, name: 'Natal' }
];

// --- HELPERS ---

const FilterChip = ({ label, active, onClick, variant }) => {
    const colors = {
        emerald: { bg: 'rgba(52, 199, 89, 0.3)', text: '#052e16' }, // Very dark green
        yellow: { bg: 'rgba(255, 215, 0, 0.4)', text: '#855a00' }, // Real Yellow / Gold
        blue: { bg: 'rgba(0, 122, 255, 0.3)', text: '#002a5c' },
        purple: { bg: 'rgba(175, 82, 222, 0.3)', text: '#3b0d4d' },
        orange: { bg: 'rgba(255, 149, 0, 0.3)', text: '#4d2b00' },
        rose: { bg: 'rgba(255, 59, 48, 0.3)', text: '#5c0e0a' },
        gray: { bg: 'rgba(142, 142, 147, 0.3)', text: '#1f1f1f' },
        green: { bg: 'rgba(34, 197, 94, 0.3)', text: '#0e3d20' },
        default: { bg: 'rgba(0, 0, 0, 0.1)', text: '#000' }
    };

    const scheme = colors[variant] || colors.default;

    return (
        <button
            onClick={onClick}
            style={{
                padding: '8px 16px', borderRadius: '50px',
                background: active ? scheme.bg : 'rgba(0,0,0,0.06)',
                color: active ? scheme.text : '#444',
                fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                transition: '0.2s', textTransform: 'uppercase',
                border: active ? `1px solid ${scheme.bg.replace('0.3', '0.5')}` : '1px solid transparent', // Dynamic darker border
                boxShadow: active ? '0 2px 5px rgba(0,0,0,0.05)' : 'none'
            }}
        >
            {label}
        </button>
    );
};

const EventChip = ({ event }) => {
    const navigate = useNavigate();

    if (!event) return null;

    const handleClick = (e) => {
        if (event.type === 'pedagogical' && event.classId) {
            e.stopPropagation();
            const targetDate = event.data?.date || (event.start instanceof Date ? event.start.toISOString().split('T')[0] : String(event.start || '').split('T')[0]);
            navigate('/pedagogical', {
                state: { subTab: 'attendance', classId: event.classId, date: targetDate, moduleId: event.data?.moduleId }
            });
            return;
        }
        if (event.type === 'mentorship') {
            e.stopPropagation();
            navigate('/pedagogical', { state: { subTab: 'mentorships' } });
            return;
        }
    };

    // --- COLOR LOGIC iOS ---
    let theme = { bg: 'rgba(0,0,0,0.05)', color: '#000', label: 'E', border: 'rgba(0,0,0,0.1)' };

    const eventId = event.id ? String(event.id) : '';

    if (eventId.startsWith('lead_')) {
        theme = { bg: 'rgba(255, 215, 0, 0.2)', color: '#855a00', label: 'CRM', border: '#FFD700' };
    } else if (event.type === 'pedagogical') {
        theme = { bg: 'rgba(99, 102, 241, 0.15)', color: '#3730a3', label: 'PED', border: '#6366F1' }; // Indigo
    } else if (event.type === 'mentorship') {
        theme = { bg: 'rgba(255, 149, 0, 0.15)', color: '#854d00', label: 'MEN', border: '#FF9500' };
    } else if (event.type === 'holiday' || event.type === 'recess') {
        theme = { bg: 'rgba(255, 59, 48, 0.15)', color: '#9e1b15', label: 'CAL', border: '#FF3B30' };
    } else if (event.type === 'block') {
        // Distinct Color for Block: Slate/Dark Gray
        theme = { bg: 'rgba(71, 85, 105, 0.2)', color: '#1e293b', label: 'BLO', border: '#475569' };
    } else if (event.type === 'financial') {
        theme = { bg: 'rgba(52, 199, 89, 0.15)', color: '#166534', label: 'FIN', border: '#34C759' };
    } else if (event.type === 'task') {
        theme = { bg: 'rgba(175, 82, 222, 0.15)', color: '#6b21a8', label: 'TAR', border: '#AF52DE' };
    }

    const timeStr = event.start && !event.isAllDay ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
        <div
            className="event-premium-chip"
            onClick={handleClick}
            style={{
                background: theme.bg,
                color: theme.color,
                borderLeft: `3px solid ${theme.border}`,
                minHeight: 'auto'
            }}
            title={event.title || 'Evento sem título'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1px' }}>
                <span style={{ fontSize: '7px', fontWeight: '900', opacity: 0.8 }}>
                    {theme.label}
                    {event.type === 'pedagogical' && event.responsibleName && (
                        <> {event.responsibleName.split(' ')[0]}</>
                    )}
                </span>
                {event.responsibleName && event.type !== 'pedagogical' && (
                    <span style={{ fontSize: '7px', fontWeight: '900', opacity: 0.8, marginLeft: '4px' }}>
                        - {getRoleName(event.responsibleRoleId)} {event.responsibleName.split(' ').slice(0, 2).join(' ')}
                    </span>
                )}
                {timeStr && <span className="event-time-badge" style={{ fontSize: '7px' }}>{timeStr}</span>}
            </div>
            <div style={{
                overflow: 'hidden',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                width: '100%',
                lineHeight: '1',
                fontSize: '8px'
            }}>
                {event.type === 'pedagogical' && event.data?.lessonNumber ? (
                    <>
                        {(() => {
                            const title = event.title || 'Sem título';
                            const lastDashIndex = title.lastIndexOf(' - ');
                            if (lastDashIndex > -1) {
                                const classNamePart = title.substring(0, lastDashIndex);
                                const modulePart = title.substring(lastDashIndex + 3);
                                return <>{classNamePart}<br />{event.data.lessonNumber} - {modulePart}</>;
                            }
                            return <>{event.data.lessonNumber} - {title}</>;
                        })()}
                    </>
                ) : (
                    event.title || 'Sem título'
                )}
            </div>
        </div>
    );
};




const EventModal = ({ isOpen, onClose, event, onSave, onDelete, onUpdate, isOwner }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        reason: event?.data?.reason || '',
        date: event?.start ? format(new Date(event.start), 'yyyy-MM-dd') : '',
        startTime: event?.start ? format(new Date(event.start), 'HH:mm') : '',
        endTime: event?.end ? format(new Date(event.end), 'HH:mm') : ''
    });

    useEffect(() => {
        if (event) {
            setFormData({
                reason: event.data?.reason || event.title?.replace('Bloqueio: ', '') || '',
                date: event.start ? format(new Date(event.start), 'yyyy-MM-dd') : '',
                startTime: event.start ? format(new Date(event.start), 'HH:mm') : '',
                endTime: event.end ? format(new Date(event.end), 'HH:mm') : ''
            });
        }
    }, [event]);

    if (!event) return null;

    const isBlock = event.type === 'block';

    const handleSave = () => {
        onSave(event.id, formData);
    };

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title={isBlock ? "Editar Bloqueio" : (event.id.toString().startsWith('lead_') ? "Detalhes da Consultoria" : event.title)}
            footer={
                <div className="flex justify-end w-full gap-2">
                    {isOwner && !event.id.toString().startsWith('lead_') && (
                        <button
                            onClick={() => onDelete(event.id)}
                            className="mr-auto px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm hover:scale-105 transition-all text-white"
                            style={{ backgroundColor: '#e11d48' }}
                        >
                            <Trash2 size={14} strokeWidth={2.5} /> Excluir
                        </button>
                    )}

                    {isOwner && isBlock && (
                        <button onClick={handleSave} className="btn-primary py-1.5 text-xs">Salvar Alterações</button>
                    )}
                    {event.id.toString().startsWith('lead_') && (
                        <button
                            onClick={() => { navigate(`/consultation-result/${event.data?.id}`); onClose(); }}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            <Sparkles size={16} /> Ir para Atendimento
                        </button>
                    )}
                    {event.id.toString().startsWith('task_') && (
                        <button
                            onClick={async () => {
                                const id = event.id.toString().split('_')[1];
                                const token = localStorage.getItem('token');
                                await fetch(`${API_URL}/tasks/${id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ status: 'done' })
                                });
                                onClose();
                                if (onUpdate) onUpdate();
                            }}
                            className="btn-primary w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                            <CheckSquare size={16} /> Concluir Tarefa
                        </button>
                    )}
                </div>
            }
        >
            <div className="space-y-4">
                {isBlock ? (
                    <>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Motivo</label>
                            <input
                                className="input-field w-full"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                disabled={!isOwner}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Data</label>
                            <input
                                type="date"
                                className="input-field w-full"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                disabled={!isOwner}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Início</label>
                                <input
                                    type="time"
                                    className="input-field w-full"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    disabled={!isOwner}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Fim</label>
                                <input
                                    type="time"
                                    className="input-field w-full"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    disabled={!isOwner}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-600">
                        {event.id.toString().startsWith('lead_') ? (
                            <div className="mt-2 flex flex-col gap-5">
                                {/* Header: Client Info */}
                                <div className="pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 leading-tight">{event.data?.name}</h3>
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Phone size={12} />
                                                <span className="text-sm font-medium">{event.data?.phone || 'Sem telefone'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Info Card */}
                                <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100/50 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                                            <Clock size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest leading-none mb-1">DATA E HORÁRIO</p>
                                            <p className="text-sm font-bold text-gray-900 capitalize">
                                                {event.start ? format(new Date(event.start), "EEEE, dd 'de' MMMM", { locale: ptBR }) : '-'}
                                            </p>
                                            <p className="text-xs font-semibold text-gray-500">
                                                às {event.start ? format(new Date(event.start), "HH:mm", { locale: ptBR }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Details */}
                                <div className="grid grid-cols-1 gap-3 px-1">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <Briefcase size={16} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-0.5">RESPONSÁVEL</p>
                                            {(() => {
                                                const nameParts = (event.data?.consultant?.name || '').split(' ');
                                                const firstName = nameParts[0] || '';
                                                const secondName = nameParts[1] || '';
                                                const cargo = ROLE_LABELS[event.data?.consultant?.roleId] || 'Consultor';
                                                const respLine = `${cargo} - ${firstName} ${secondName}`.trim();
                                                return <p className="text-sm font-bold text-gray-800">{respLine}</p>;
                                            })()}
                                        </div>
                                    </div>

                                    {event.data?.notes && (
                                        <div className="flex items-start gap-3 mt-1">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center shrink-0">
                                                <StickyNote size={16} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">OBSERVAÇÕES</p>
                                                <p className="text-sm text-gray-600 italic leading-relaxed">
                                                    "{event.data.notes}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : event.type === 'task' ? (
                            <div className="mt-2 flex flex-col gap-5">
                                {/* Header */}
                                <div className="pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                            <CheckSquare size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 leading-tight">Detalhes da Tarefa</h3>
                                            <p className="text-sm font-medium text-gray-500">Administrativo</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Title Card */}
                                <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-100/50">
                                    <h4 className="text-base font-bold text-gray-900 mb-1">{event.title}</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">{event.data?.description || 'Sem descrição.'}</p>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">DATA</p>
                                        <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                                            <CalendarIcon size={14} />
                                            {format(new Date(event.start), 'dd/MM/yyyy')}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">STATUS</p>
                                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${event.data?.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {event.data?.status === 'pending' ? 'PENDENTE' : 'CONCLUÍDA'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : event.type === 'financial' ? (
                            <div className="mt-2 flex flex-col gap-5">
                                {/* Header */}
                                <div className="pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${event.data?.direction === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {event.data?.direction === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 leading-tight">Registro Financeiro</h3>
                                            <p className="text-sm font-medium text-gray-500">{event.data?.direction === 'income' ? 'Receita' : 'Despesa'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Amount Card */}
                                <div className={`rounded-xl p-4 border flex flex-col gap-1 ${event.data?.direction === 'income' ? 'bg-green-50/50 border-green-100/50' : 'bg-red-50/50 border-red-100/50'}`}>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${event.data?.direction === 'income' ? 'text-green-800' : 'text-red-800'}`}>VALOR</p>
                                    <p className={`text-2xl font-black ${event.data?.direction === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(event.data?.amount || 0)}
                                    </p>
                                    <p className="text-sm font-medium text-gray-600 mt-1">{event.data?.description}</p>
                                </div>

                                {/* Details Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">VENCIMENTO</p>
                                        <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
                                            <CalendarIcon size={14} />
                                            {format(new Date(event.start), 'dd/MM/yyyy')}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">STATUS</p>
                                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${event.data?.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {event.data?.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 flex flex-col gap-5">
                                {/* Header */}
                                <div className="pb-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                            <CalendarIcon size={16} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-gray-900 leading-tight">{event.title}</h3>
                                            <p className="text-sm font-medium text-gray-500 capitalize">{event.type === 'holiday' ? 'Feriado' : event.type === 'recess' ? 'Recesso' : 'Evento'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Date Card */}
                                <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100/50 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white text-gray-600 flex items-center justify-center shadow-sm border border-gray-100">
                                        <Clock size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">DATA</p>
                                        <p className="text-sm font-bold text-gray-900 capitalize">
                                            {format(new Date(event.start), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>

                                {/* Notes if any */}
                                {event.data && Object.keys(event.data).length > 0 && (
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {Object.entries(event.data).map(([k, v]) => (
                                            typeof v !== 'object' && <p key={k} className="text-xs text-gray-600 mb-1"><strong className="capitalize text-gray-800">{k}:</strong> {String(v)}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VoxModal>
    );
};

const CalendarView = ({ events, currentDate, setCurrentDate, onEventClick }) => {
    const { user } = useAuth();
    const [expandedDay, setExpandedDay] = useState(null);

    const [filters, setFilters] = useState(() => {
        const defaults = { commercial: true, pedagogical: true, administrative: true, financial: true, holiday: true, blocks: true };
        try {
            const saved = localStorage.getItem('calendar_filters');
            if (!saved) return defaults;
            return { ...defaults, ...JSON.parse(saved) };
        } catch (e) {
            return defaults;
        }
    });

    useEffect(() => { localStorage.setItem('calendar_filters', JSON.stringify(filters)); }, [filters]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInSum = new Date(year, month + 1, 0).getDate();
        const days = [];
        const prevMonthLast = new Date(year, month, 0).getDate();
        for (let i = firstDay - 1; i >= 0; i--) days.push({ date: new Date(year, month - 1, prevMonthLast - i), isCurrentMonth: false });
        for (let i = 1; i <= daysInSum; i++) days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        const remaining = (7 - (days.length % 7)) % 7;
        for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
        return days;
    };

    const monthDays = getDaysInMonth(currentDate);
    const visibleEvents = (events || []).filter(e => {
        if (filters.commercial && (e.type === 'commercial' || e.id.toString().startsWith('lead_'))) return true;
        if (filters.pedagogical && (e.type === 'pedagogical' || e.type === 'mentorship')) return true;
        if (filters.administrative && (e.type === 'administrative' || e.type === 'task')) return true;
        if (filters.financial && e.type === 'financial') return true;
        if (filters.holiday && (e.type === 'holiday' || e.type === 'recess')) return true;
        if (filters.blocks && e.type === 'block') return true;
        return false;
    });

    const getEventsForDay = (day) => {
        return visibleEvents.filter(ev => {
            const s = parseLocalDate(ev.start);
            const e = ev.end ? parseLocalDate(ev.end) : new Date(s);
            const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
            const sm = new Date(s.getFullYear(), s.getMonth(), s.getDate());
            const em = new Date(e.getFullYear(), e.getMonth(), e.getDate());
            return d >= sm && d <= em;
        }).sort((a, b) => (a.type === 'holiday' || a.type === 'recess') ? -1 : 1);
    };

    return (
        <div className="calendar-main-card">
            {/* Header de Navegação Premium */}
            <div className="calendar-nav-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <h2 className="calendar-nav-title">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', color: '#fff', cursor: 'pointer' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', color: '#fff', cursor: 'pointer' }}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Filtros em Linha no Header */}
                {/* Filtros em Linha no Header */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px' }}>
                    <FilterChip label="Comercial" active={filters.commercial} variant="yellow" onClick={() => setFilters(f => ({ ...f, commercial: !f.commercial }))} />
                    <FilterChip label="Pedagógico" active={filters.pedagogical} variant="blue" onClick={() => setFilters(f => ({ ...f, pedagogical: !f.pedagogical }))} />
                    <FilterChip label="Administrativo" active={filters.administrative} variant="purple" onClick={() => setFilters(f => ({ ...f, administrative: !f.administrative }))} />
                    <FilterChip label="Financeiro" active={filters.financial} variant="green" onClick={() => setFilters(f => ({ ...f, financial: !f.financial }))} />
                    <FilterChip label="Feriados" active={filters.holiday} variant="rose" onClick={() => setFilters(f => ({ ...f, holiday: !f.holiday }))} />
                    <FilterChip label="Bloqueios" active={filters.blocks} variant="gray" onClick={() => setFilters(f => ({ ...f, blocks: !f.blocks }))} />
                </div>
            </div>

            {/* Grid do Calendário */}
            <div className="calendar-grid-header">
                {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                    <div key={d} className="calendar-weekday">{d}</div>
                ))}
            </div>

            <div className="calendar-days-grid">
                {monthDays.map((dayObj, i) => {
                    const isToday = new Date().toDateString() === dayObj.date.toDateString();
                    const dailyEvents = getEventsForDay(dayObj.date);
                    const MAX_EVENTS = 4;
                    const hasMore = dailyEvents.length > MAX_EVENTS;
                    const displayEvents = hasMore ? dailyEvents.slice(0, MAX_EVENTS) : dailyEvents;

                    return (
                        <div
                            key={i}
                            className={`calendar-day-cell ${dayObj.isCurrentMonth ? '' : 'other-month'} ${isToday ? 'today' : ''}`}
                        >
                            <div className="calendar-day-number">{dayObj.date.getDate()}</div>
                            <div className="calendar-events-container">
                                {displayEvents.map(ev => (
                                    <div key={ev.id} onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}>
                                        <EventChip event={ev} />
                                    </div>
                                ))}
                                {hasMore && (
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedDay({ date: dayObj.date, events: dailyEvents });
                                        }}
                                        style={{
                                            fontSize: '10px',
                                            color: '#64748b',
                                            background: '#f1f5f9',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            textAlign: 'center',
                                            marginTop: '2px'
                                        }}
                                    >
                                        + {dailyEvents.length - MAX_EVENTS} mais
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <VoxModal
                isOpen={!!expandedDay}
                onClose={() => setExpandedDay(null)}
                title={expandedDay ? format(expandedDay.date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}
                width="600px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto' }}>
                    {expandedDay?.events.map(ev => (
                        <div key={ev.id} onClick={() => { setExpandedDay(null); onEventClick(ev); }} style={{ cursor: 'pointer' }}>
                            <EventChip event={ev} />
                        </div>
                    ))}
                </div>
            </VoxModal>
        </div>
    );
};


const SettingsView = () => {
    const { user } = useAuth();
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '', type: 'holiday' });
    const [toast, setToast] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);

    // Resolve Numeric Unit ID for Settings (Fixes ReferenceError)
    const [numericUnitId, setNumericUnitId] = useState(null);
    useEffect(() => {
        if (user && user.unitId) {
            if (!isNaN(Number(user.unitId))) {
                setNumericUnitId(Number(user.unitId));
            } else {
                let hash = 0;
                const str = String(user.unitId);
                for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
                setNumericUnitId(Math.abs(hash));
            }
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const holidaysRes = await fetch(`${API_URL}/calendar/holidays`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const holidaysData = holidaysRes.ok ? await holidaysRes.json() : [];

            // Fetch blocks via events, simple range for list
            const year = new Date().getFullYear();
            const start = new Date(year, 0, 1).toISOString();
            const end = new Date(year, 11, 31).toISOString();

            const eventsRes = await fetch(`${API_URL}/calendar/events?start=${start}&end=${end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const eventsData = eventsRes.ok ? await eventsRes.json() : [];
            const blocksData = eventsData.filter(e => e.type === 'block');

            const combined = [
                ...holidaysData.map(h => ({ ...h, listType: 'holiday' })),
                ...blocksData.map(b => ({
                    id: b.id.replace('block_', ''),
                    name: b.title.replace('Bloqueio: ', ''),
                    startDate: b.start,
                    endDate: b.end,
                    type: 'block',
                    listType: 'block',
                    isOwner: b.data?.userId === user.id
                }))
            ];
            // Fix isOwner check: user object is available from hook
            const finalCombined = combined.map(i => ({ ...i, isOwner: i.listType === 'block' ? (i.isOwner || (eventsData.find(e => e.id === `block_${i.id}`)?.data?.userId === user.id)) : false }));

            setHolidays(finalCombined);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const [itemToEdit, setItemToEdit] = useState(null);

    const handleEditClick = (item) => {
        setItemToEdit(item);
        setNewHoliday({
            name: item.name,
            startDate: item.startDate,
            endDate: item.endDate || item.startDate,
            type: item.type,
            isGlobal: !item.unitId // Se não tem unitId, é global
        });
        setIsCreating(true);
    };

    const handleCreateHoliday = async () => {
        // Robust ID Generation (Stateless)
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };
        const resolvedUnitId = getNumericId(user?.unitId);

        if (!newHoliday.name || !newHoliday.startDate) {
            setToast({ message: 'Preencha nome e data.', type: 'error' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const url = itemToEdit
                ? `${API_URL}/calendar/holidays/${itemToEdit.id}`
                : `${API_URL}/calendar/holidays`;
            const method = itemToEdit ? 'PUT' : 'POST';

            const payload = {
                ...newHoliday,
                endDate: newHoliday.endDate || newHoliday.startDate,
                isGlobal: newHoliday.isGlobal // Pass isGlobal flag
            };

            // If not master, force local
            if (Number(user.roleId) !== 1) {
                payload.isGlobal = false;
            }

            // For creation, we must attach unitId. For Update, usually not needed (Backend checks).
            // But confirming unitId doesn't hurt.
            // If editing Global as Master, unitId might be null.
            // If creating local, unitId is resolvedUnitId.
            if (!itemToEdit && !payload.isGlobal && resolvedUnitId) {
                payload.unitId = resolvedUnitId;
            }

            if (payload.type === 'recess' && !itemToEdit) {
                if (!payload.name.toLowerCase().includes('recesso')) {
                    payload.name = `Recesso: ${payload.name}`;
                }
                // Allow saving as 'recess' type.
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                loadData();
                setToast({ message: 'Salvo com sucesso!', type: 'success' });
                setIsCreating(false);
                setItemToEdit(null);
                setNewHoliday({ name: '', startDate: '', endDate: '', type: 'holiday', isGlobal: false });
            } else {
                const errText = await res.text();
                setToast({ message: `Erro ao salvar: ${errText}`, type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ message: 'Erro de conexão.', type: 'error' });
        }
    };


    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const item = itemToDelete;

        let endpoint = `/calendar/holidays/${item.id}`;
        if (item.listType === 'block') {
            // Basic permission check
            if (Number(user.roleId) !== 1 && !item.isOwner) {
                alert("Você não tem permissão para excluir este bloqueio.");
                setDeleteModalOpen(false);
                return;
            }
            endpoint = `/calendar/blocks/${item.id}`;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadData();
                setToast({ message: 'Removido.', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao remover.', type: 'error' });
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const getSecondSunday = (year, month) => {
        const date = new Date(year, month, 1);
        const day = date.getDay();
        const diff = day === 0 ? 7 : 14 - day; // If starts on Sunday, 2nd is +7. If Monday (1), 1st Sun is +6, 2nd is +13?
        // Logic: 
        // 1st Sun: (7 - day) % 7. if day=0 (Sun), +0 (1st is 1st). 
        // Wait.
        // If 1st is Sun (0): 2nd Sun is 8th. (+7 days).
        // If 1st is Mon (1): 1st Sun is 7th. 2nd Sun is 14th.
        // If 1st is Sat (6): 1st Sun is 2nd. 2nd Sun is 9th.

        // Offset to first Sunday: (7 - day) % 7.  
        // Date of 1st Sunday = 1 + (7 - day) % 7.
        // Date of 2nd Sunday = 1 + (7 - day) % 7 + 7.
        const headerOffset = (7 - day) % 7;
        const secondSundayDate = 1 + headerOffset + 7;
        return secondSundayDate;
    };



    return (
        <div className="h-full overflow-y-auto p-1">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><Flag size={20} /></div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">Feriados, Recessos e Bloqueios</h3>
                        <p className="text-xs text-gray-500">Gerencie todos os eventos do calendário</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {user && ![41, 51].includes(Number(user.roleId)) && (
                        <button onClick={() => setIsCreating(true)} className="btn-primary">
                            <Plus size={14} /> Adicionar
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-2">
                {holidays.length === 0 && (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        <CalendarIcon size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhum registro.</p>
                    </div>
                )}
                {holidays.filter(h => h.listType === 'block' || h.unitId).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map(h => {
                    const start = parseLocalDate(h.startDate);
                    const end = h.endDate ? parseLocalDate(h.endDate) : start;
                    const isHoliday = h.type === 'holiday';
                    const isRecess = h.type === 'recess';
                    const isBlock = h.listType === 'block';

                    return (
                        <div key={h.id} className={`p-3 rounded-lg border-l-4 bg-white shadow-sm flex justify-between items-center group transition-all hover:shadow-md ${(isHoliday || isRecess) ? 'border-rose-500' : 'border-gray-400'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${(isHoliday || isRecess) ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                    <span className="text-[10px] font-bold uppercase">{format(start, 'MMM', { locale: ptBR })}</span>
                                    <span className="text-xl font-black leading-none">
                                        {format(start, 'dd')}
                                        {start.getDate() !== end.getDate() && <span className="text-xs">-{format(end, 'dd')}</span>}
                                    </span>
                                    <span className="text-[10px] text-gray-400">{format(start, 'yyyy')}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${(isHoliday || isRecess) ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {isHoliday ? 'Feriado' : isRecess ? 'Recesso' : 'Bloqueio'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {format(start, 'EEEE', { locale: ptBR })}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-800 text-sm">{h.name}</h4>
                                    {isBlock && <span className="text-[10px] text-gray-400">Bloqueio do Usuário</span>}
                                    {!h.unitId && !isBlock && <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1 rounded ml-2">Nacional</span>}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {/* Edit Button for Manual/Recess (Not Global, Not Block for now) */}
                                {(!isBlock && (h.unitId || user.role === 'master')) && (
                                    <button
                                        onClick={() => handleEditClick(h)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:scale-105"
                                        style={{
                                            backgroundColor: '#f59e0b',
                                            color: 'white',
                                            border: '2px solid white',
                                            boxShadow: '0 0 0 2px #f59e0b, 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <Pencil size={14} color="#ffffff" strokeWidth={2.5} />
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDeleteClick(h)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:scale-105"
                                    style={{
                                        backgroundColor: '#e11d48',
                                        color: 'white',
                                        border: '2px solid white',
                                        boxShadow: '0 0 0 2px #e11d48, 0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    <Trash2 size={14} color="#ffffff" strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <VoxModal
                isOpen={isCreating}
                onClose={() => { setIsCreating(false); setItemToEdit(null); setNewHoliday({ name: '', startDate: '', endDate: '', type: 'holiday', isGlobal: false }); }}
                title={itemToEdit ? "Editar Evento" : "Novo Evento"}
                footer={
                    <>
                        <button onClick={() => { setIsCreating(false); setItemToEdit(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold text-sm">Cancelar</button>
                        <button onClick={handleCreateHoliday} className="px-4 py-2 bg-[#0CA9A7] text-white rounded-lg hover:brightness-90 font-bold text-sm">Salvar</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome</label>
                        <input className="input-field w-full" value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} placeholder="Ex: Carnaval" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Início</label>
                            <input type="date" className="input-field w-full" value={newHoliday.startDate} onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value, endDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fim</label>
                            <input type="date" className="input-field w-full" value={newHoliday.endDate} onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
                        <select
                            className="input-field w-full bg-white"
                            value={newHoliday.type}
                            onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                        >
                            <option value="holiday">Feriado</option>
                            <option value="recess">Recesso</option>
                        </select>
                    </div>
                    {Number(user.roleId) === 1 && (
                        <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                            <input
                                type="checkbox"
                                id="isGlobal"
                                checked={newHoliday.isGlobal}
                                onChange={e => setNewHoliday({ ...newHoliday, isGlobal: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <label htmlFor="isGlobal" className="text-sm font-bold text-indigo-700 cursor-pointer">
                                Tornar este evento GLOBAL (Visto por todas as unidades)
                            </label>
                        </div>
                    )}
                </div>
            </VoxModal>

            {/* Delete Modal */}
            <VoxModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Excluir Evento"
                width="400px"
                theme="danger"
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
                        <Trash2 className="text-red-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Evento?</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        O evento <strong>{itemToDelete?.name}</strong> será excluído permanentemente do calendário.
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md flex items-center gap-2 text-sm scale-100 hover:scale-105 transform duration-200"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </VoxModal>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---

const AgendaPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('calendar');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal States moved here
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [newBlock, setNewBlock] = useState({ date: '', startTime: '', endTime: '', reason: '' });

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [eventToDeleteId, setEventToDeleteId] = useState(null);

    // Resolve Numeric IDs (Security/Backend Requirement)
    const [numericUnitId, setNumericUnitId] = useState(null);
    const [numericUserId, setNumericUserId] = useState(null);

    // Filter Logic States
    const [units, setUnits] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [selectedFilterUnit, setSelectedFilterUnit] = useState('');
    const [selectedFilterRole, setSelectedFilterRole] = useState('');
    const [selectedFilterUser, setSelectedFilterUser] = useState('');

    // Initialize unit filter for non-global users
    useEffect(() => {
        if (user && user.unitId && ![1, 10].includes(Number(user.roleId))) {
            // For franchisees, managers, etc., pre-select their unit
            setSelectedFilterUnit(String(user.unitId));
        }
    }, [user]);

    useEffect(() => {
        if (user && [1, 10, 20, 30, 50].includes(Number(user.roleId))) {
            fetchUnitsAndUsers();
        }
    }, [user]);

    const fetchUnitsAndUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            // Fetch Units (Only for Master/Director)
            if ([1, 10].includes(Number(user.roleId))) {
                const uRes = await fetch(`${API_URL}/units`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (uRes.ok) {
                    const uData = await uRes.json();
                    uData.sort((a, b) => a.name.localeCompare(b.name));
                    setUnits(uData);
                }
            } else if (user.unitId) {
                // If Manager, pre-select unit?
                // Actually managers can only see their unit, so dropdown might be redundant or just 1 option
                setUnits([{ id: user.unitId, name: user.unit || 'Minha Unidade' }]);
            }

            // Fetch Users
            // Depending partly on selected unit, but for now grab all available to role
            const usRes = await fetch(`${API_URL}/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (usRes.ok) {
                const allUsers = await usRes.json();
                let filtered = allUsers;

                // Explicitly ALLOW globals to see everyone (which they should already from API)
                // Filter users by unit ONLY if NOT Master/Director
                if (![1, 10].includes(Number(user.roleId)) && user.unitId) {
                    filtered = allUsers.filter(u => String(u.unitId) == String(user.unitId));
                }

                filtered.sort((a, b) => a.name.localeCompare(b.name));
                setUsersList(filtered);
            }
        } catch (err) {
            console.error('Error fetching filters:', err);
        }
    };


    useEffect(() => {
        if (user) {
            // 1. Resolve Unit ID
            if (user.unitId) {
                if (!isNaN(Number(user.unitId))) {
                    setNumericUnitId(Number(user.unitId));
                } else {
                    // Deterministic Hash for Unit UUID
                    let hash = 0;
                    const str = String(user.unitId);
                    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
                    setNumericUnitId(Math.abs(hash));
                }
            }
            // 2. Resolve User ID (Force Numeric)
            if (user.id) {
                if (!isNaN(Number(user.id))) {
                    setNumericUserId(Number(user.id));
                } else {
                    // Deterministic Hash for User UUID
                    let hash = 0;
                    const str = String(user.id);
                    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
                    setNumericUserId(Math.abs(hash));
                }
            }
        }
    }, [user]);

    useEffect(() => {
        fetchEvents();
    }, [currentDate, activeTab, selectedFilterUnit, selectedFilterRole, selectedFilterUser]);

    const fetchEvents = async () => {
        if (activeTab !== 'calendar') return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const year = currentDate.getFullYear();

            // Limit range to current year +/- 1 to avoid excessive data and potential timeouts
            const start = new Date(year - 1, 0, 1).toISOString();
            const end = new Date(year + 1, 11, 31).toISOString();

            console.log(`[Agenda] Fetching events from ${start} to ${end}`);

            const res = await fetch(`${API_URL}/calendar/events?start=${start}&end=${end}&unitId=${selectedFilterUnit}&roleFilter=${selectedFilterRole}&targetUserId=${selectedFilterUser}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`[Agenda] Successfully received ${data.length} events from server.`);

                const parsedData = Array.isArray(data) ? data.map(ev => ({
                    ...ev,
                    start: parseLocalDate(ev.start),
                    end: parseLocalDate(ev.end)
                })) : [];

                setEvents(parsedData);
            } else {
                console.error(`[Agenda] Failed to fetch events. Status: ${res.status}`);
                const errText = await res.text();
                console.error(`[Agenda] Error detail:`, errText);
            }
        } catch (error) {
            console.error("[Agenda] Error in fetchEvents:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBlock = async () => {
        if (!newBlock.date || !newBlock.startTime || !newBlock.endTime || !newBlock.reason) {
            alert("Preencha todos os campos");
            return;
        }
        const startDateTime = new Date(`${newBlock.date}T${newBlock.startTime}`);
        const endDateTime = new Date(`${newBlock.date}T${newBlock.endTime}`);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/calendar/blocks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    startTime: startDateTime,
                    endTime: endDateTime,
                    reason: newBlock.reason,
                    type: 'block',
                    unitId: numericUnitId // Use numeric ID
                })
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
            alert("Erro de conexão.");
        }
    };

    const handleUpdateEvent = async (eventId, formData) => {
        const eventObj = events.find(e => e.id === eventId);
        if (!eventObj || eventObj.type !== 'block') {
            alert("Somente bloqueios podem ser editados no momento.");
            return;
        }

        const id = eventId.includes('_') ? eventId.split('_')[1] : eventId;

        const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/calendar/blocks/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    startTime: startDateTime,
                    endTime: endDateTime,
                    reason: formData.reason
                })
            });

            if (res.ok) {
                setSelectedEvent(null);
                fetchEvents();
            } else {
                const errText = await res.text();
                alert(`Erro ao atualizar bloqueio: ${errText}`);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
        }
    };

    const confirmDeleteEvent = async () => {
        if (!eventToDeleteId) return;

        // Determine if block or holiday based on ID logic or finding it in events list
        // Events in `events` state have original IDs (holiday_1 or block_1).
        // The ID passed here is likely the one from the event object.
        // Let's find the event type from the ID or search the events array.

        let isBlock = false;
        let idRaw = eventToDeleteId;

        // Check format: usually block_ID or holiday_ID in some contexts, but let's check events array
        const eventObj = events.find(e => e.id === eventToDeleteId);
        if (eventObj) {
            isBlock = eventObj.type === 'block';
            idRaw = eventToDeleteId.replace('block_', '').replace('holiday_', '');
            // The API likely expects the raw numeric/UUID ID, depending on previous implementation. 
            // Looking at `handleDelete` in SettingsView: `if (item.listType === 'block') ... endpoint = /calendar/blocks/${item.id}`
            // The IDs in `events` might be prefixed. 
            // `Events` from API in `loadData`: `blocksData.map(b => ({ id: b.id.replace('block_', '') ...`
            // Wait, in `fetchEvents` (CalendarView), `events` come from `/calendar/events`.
            // The API response for events usually prefixes IDs to ensure uniqueness in calendar. 
            // Let's assume the ID passed `onDelete` (from `EventModal`) matches the one in `selectedEvent` (which is from `events`).
            // If `events` has prefixed IDs, we need to strip them.
        } else {
            // Fallback if not found (shouldn't happen)
            if (eventToDeleteId.startsWith('block_')) isBlock = true;
            idRaw = eventToDeleteId.replace(/^(block_|holiday_)/, '');
        }

        // Actually, looking at `handleDeleteEvent` original code: `const id = eventId.split('_')[1];`
        // So yes, we split.

        try {
            const token = localStorage.getItem('token');
            const id = eventToDeleteId.includes('_') ? eventToDeleteId.split('_')[1] : eventToDeleteId;
            const endpoint = isBlock ? `/calendar/blocks/${id}` : `/calendar/holidays/${id}`;
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setSelectedEvent(null);
                setEventToDeleteId(null);
                setIsDeleteModalOpen(false);
                fetchEvents();
            } else {
                alert("Erro ao excluir.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/calendar/holidays`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const mapped = data.map(h => ({
                    ...h,
                    id: h.id || `holiday_${Math.random()}`,
                    start: parseLocalDate(h.startDate),
                    end: parseLocalDate(h.endDate),
                    title: h.name,
                    roleId: null,
                    type: h.type || 'holiday',
                    isAllDay: true
                }));
                // Filter Duplicates (Name + Date)
                const unique = [];
                const seen = new Set();
                mapped.forEach(h => {
                    // Only keep type holiday/recess
                    if (h.type !== 'holiday' && h.type !== 'recess') return;

                    const key = `${h.startDate}|${h.name}`; // Simple composite key
                    if (!seen.has(key)) {
                        seen.add(key);
                        unique.push(h);
                    }
                });
                setHolidays(unique);
            }
        } catch (error) {
            console.error("Failed to fetch holidays:", error);
        }
    };

    const handleDeleteEvent = (eventId) => {
        setEventToDeleteId(eventId);
        setIsDeleteModalOpen(true);
        setSelectedEvent(null);
    };



    useEffect(() => {
        // fetchHolidays(); // Removed redundant fetch (using events)
        if (activeTab === 'calendar') {
            console.log('ANTIGRAVITY DEBUG: All Events', events);
            console.log('ANTIGRAVITY DEBUG: User', user);
            console.log('ANTIGRAVITY DEBUG: Blocks', events?.filter(e => e.type === 'block'));
        }
    }, [events, user, activeTab]);

    return (
        <div className="agenda-page page-fade-in" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    {activeTab === 'settings' && (
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm"
                            title="Voltar ao Calendário"
                        >
                            <ChevronLeft size={20} className="text-gray-600" />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                    {activeTab === 'calendar' ? (
                        <>
                            {[1, 10, 20, 30, 40, 50, 60].includes(Number(user?.roleId)) && (
                                <button
                                    onClick={() => navigate('/administrative/calendar')}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
                                >
                                    <Settings size={18} /> Configurações
                                </button>
                            )}
                            {[20, 30, 40, 41, 50, 51].includes(Number(user?.roleId)) && (
                                <button
                                    onClick={() => setShowBlockModal(true)}
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
                                >
                                    <Clock size={18} /> Bloquear Agenda
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            onClick={() => setActiveTab('calendar')}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
                        >
                            <CalendarIcon size={18} /> Ver Calendário
                        </button>
                    )}
                </div>
            </header>

            {activeTab === 'calendar' && [1, 10, 20, 30, 50].includes(Number(user?.roleId)) && (
                <div className="filter-bar-ios animate-in slide-in-from-top-2 duration-300">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={18} color="#8E8E93" />
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase' }}>Filtros:</span>
                        </div>

                        {[1, 10].includes(Number(user?.roleId)) && (
                            <select
                                className="vox-input text-sm py-1 px-3 h-[38px]"
                                value={selectedFilterUnit}
                                onChange={(e) => { setSelectedFilterUnit(e.target.value); setSelectedFilterUser(''); }}
                                style={{ background: 'transparent', border: 'none', fontWeight: 'bold', outline: 'none' }}
                            >
                                <option value="">Todas Unidades</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        )}

                        <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)' }}></div>

                        <select
                            className="vox-input text-sm py-1 px-3 h-[38px]"
                            value={selectedFilterRole}
                            onChange={(e) => { setSelectedFilterRole(e.target.value); setSelectedFilterUser(''); }}
                            style={{ background: 'transparent', border: 'none', fontWeight: 'bold', outline: 'none' }}
                        >
                            <option value="">Todos Cargos</option>
                            <option value="10">Diretor</option>
                            <option value="20">Franqueado</option>
                            <option value="30">Gestor</option>
                            <option value="60">Administrativo</option>
                            <option value="40">Lider Comercial</option>
                            <option value="50">Lider Pedagógico</option>
                            <option value="41">Consultor</option>
                            <option value="51">Professor</option>
                        </select>

                        <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)' }}></div>

                        <select
                            className="vox-input text-sm py-1 px-3 h-[38px]"
                            value={selectedFilterUser}
                            onChange={(e) => setSelectedFilterUser(e.target.value)}
                            style={{ background: 'transparent', border: 'none', fontWeight: 'bold', outline: 'none' }}
                        >
                            <option value="">Todos Usuários</option>
                            {usersList
                                .filter(u => (!selectedFilterUnit || String(u.unitId) == String(selectedFilterUnit)) && (!selectedFilterRole || String(u.roleId) == String(selectedFilterRole)))
                                .map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="calendar-content flex-1 overflow-hidden" style={{ minHeight: 0 }}>
                {activeTab === 'calendar' ? (
                    <CalendarView
                        events={events}
                        currentDate={currentDate}
                        setCurrentDate={setCurrentDate}
                        onEventClick={setSelectedEvent}
                    />
                ) : (
                    <SettingsView />
                )}
            </div>

            <EventModal
                isOpen={!!selectedEvent}
                onClose={() => setSelectedEvent(null)}
                event={selectedEvent}
                onSave={handleUpdateEvent}
                onUpdate={fetchEvents}
                onDelete={handleDeleteEvent}
                isOwner={
                    (selectedEvent?.data?.userId === user?.id) ||
                    (numericUserId && (selectedEvent?.data?.userId === numericUserId)) ||
                    ([1, 10, 20, 30, 60].includes(user?.roleId)) // Master, Dir, Fran, Man, AdminFin
                }
            />

            {/* Block Modal */}
            <VoxModal
                isOpen={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                title="Bloquear Agenda"
                footer={
                    <>
                        <button onClick={() => setShowBlockModal(false)} className="btn-secondary">Cancelar</button>
                        <button onClick={handleCreateBlock} className="btn-primary">Criar Bloqueio</button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Data</label>
                        <input type="date" className="input-field w-full bg-white rounded-lg border-gray-300" value={newBlock.date} onChange={e => setNewBlock({ ...newBlock, date: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Início</label>
                            <input type="time" className="input-field w-full bg-white rounded-lg border-gray-300" value={newBlock.startTime} onChange={e => setNewBlock({ ...newBlock, startTime: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fim</label>
                            <input type="time" className="input-field w-full bg-white rounded-lg border-gray-300" value={newBlock.endTime} onChange={e => setNewBlock({ ...newBlock, endTime: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Motivo</label>
                        <input type="text" className="input-field w-full bg-white rounded-lg border-gray-300" placeholder="Ex: Almoço" value={newBlock.reason} onChange={e => setNewBlock({ ...newBlock, reason: e.target.value })} />
                    </div>
                </div>
            </VoxModal>

            {/* Delete Event Modal */}
            <VoxModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Excluir Evento"
                width="400px"
                theme="danger"
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
                        <Trash2 className="text-red-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Evento?</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        O evento será excluído permanentemente.
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDeleteEvent}
                            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md flex items-center gap-2 text-sm scale-100 hover:scale-105 transform duration-200"
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </VoxModal>
        </div>
    );
};

export default AgendaPage;
