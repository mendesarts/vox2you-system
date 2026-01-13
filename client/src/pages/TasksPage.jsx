import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertTriangle, Briefcase, GraduationCap, DollarSign, ArrowRight, Plus, Calendar, Filter, X, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './tasks.css';
import LeadDetailsModal from './components/LeadDetailsModal';
import EnrollmentWizard from './pedagogical/StudentRegistrationWizard';
import { VoxModal } from '../components/VoxUI';
import { ROLE_LABELS } from '../utils/roles';

const STAGE_CONFIG = {
    'new': { label: 'Novo Lead', color: '#3b82f6', bg: '#eff6ff' },
    'connecting': { label: 'Conectando', color: '#8b5cf6', bg: '#f5f3ff' },
    'connected': { label: 'Conexão', color: '#6366f1', bg: '#eef2ff' },
    'scheduled': { label: 'Agendamento', color: '#f59e0b', bg: '#fffbeb' },
    'no_show': { label: 'No-Show', color: '#ef4444', bg: '#fef2f2' },
    'negotiation': { label: 'Negociação', color: '#10b981', bg: '#ecfdf5' },
    'won': { label: 'Matriculados', color: '#059669', bg: '#f0fdf4' },
    'closed': { label: 'Encerrado', color: '#6b7280', bg: '#f3f4f6' },
    'social_comment': { label: 'Comentário', color: '#E1306C', bg: '#fff1f2' },
    'social_direct': { label: 'Direct', color: '#833AB4', bg: '#faf5ff' },
    'social_prospect': { label: 'Prospect', color: '#F77737', bg: '#fff7ed' },
    'internal_other': { label: 'Outros', color: '#64748b', bg: '#f8fafc' },
    'internal_team': { label: 'Time', color: '#0f172a', bg: '#f1f5f9' }
};

const TasksPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // -- STATES --
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [units, setUnits] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewTask, setViewTask] = useState(null);
    const [taskLeadId, setTaskLeadId] = useState(null);
    const [fetchedLead, setFetchedLead] = useState(null);
    const [showEnrollmentWizard, setShowEnrollmentWizard] = useState(false);
    const [classes, setClasses] = useState([]);

    // Dates
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0];
    });

    const [newTask, setNewTask] = useState({
        title: '', description: '', dueDate: new Date().toISOString().split('T')[0],
        dueTime: '10:00', priority: 'medium', category: 'administrative'
    });

    const isGlobalUser = [1, 10].includes(Number(user?.roleId));
    const isManagerial = [1, 10, 20, 30, 60, 70].includes(Number(user?.roleId) || 0);

    // -- EFFECTS --
    useEffect(() => { fetchTasks(); }, [selectedUnit, startDate, endDate, statusFilter]);
    useEffect(() => { if (isGlobalUser) fetchUnits(); }, []);

    // -- DATA FETCHING --
    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setUnits(await res.json());
        } catch (error) { console.error(error); }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClasses(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks?start=${startDate}&end=${endDate}`;
            if (selectedUnit) url += `&unitId=${selectedUnit}`;

            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setTasks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro tasks:', error);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    // -- LOGIC --
    const getTaskStatus = (task) => {
        if (task.status === 'done') return 'done';
        if (!task.dueDate) return 'pending';
        return new Date(task.dueDate) < new Date() ? 'overdue' : 'pending';
    };

    const handleToggleStatus = async (task) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = task.status === 'done' ? 'pending' : 'done';
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks/${task.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus })
            });
            fetchTasks();
        } catch (error) { console.error(error); }
    };

    const handleTaskClick = async (task) => {
        setViewTask(task);

        let leadId = task.leadId || task.data?.leadId;
        if (!leadId && task.link?.includes('openLeadId=')) {
            leadId = task.link.match(/openLeadId=(\d+)/)?.[1];
        }

        if (leadId) {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads/${leadId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const leadData = await res.json();
                    setFetchedLead(leadData);
                    setTaskLeadId(leadId);
                }
            } catch (e) { console.error(e); }
        }
    };

    const handleOpenTaskAction = async (task) => {
        if (!task) return;

        // 1. Enrollment Tasks
        if (task.title?.toLowerCase().includes('matricular')) {
            await fetchClasses();
            setShowEnrollmentWizard(true);
            return;
        }

        // 2. Link Tasks (Attendance, etc)
        if (task.link) {
            navigate(task.link, { state: task.state });
            return;
        }

        // 3. Lead Details
        if (task.leadId) {
            // Already fetched by handleTaskClick
            if (fetchedLead) {
                setViewTask(null);
                setTaskLeadId(task.leadId);
                return;
            }
        }

        // Fallback: Just close
        setViewTask(null);
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...newTask, dueDate: `${newTask.dueDate}T${newTask.dueTime}:00`, userId: user.id };
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            setIsModalOpen(false);
            fetchTasks();
            setNewTask({ title: '', description: '', dueDate: new Date().toISOString().split('T')[0], dueTime: '10:00', priority: 'medium', category: 'administrative' });
        } catch (error) { console.error(error); }
    };

    // -- RENDERING --
    const filteredTasks = tasks.filter(task => {
        const s = getTaskStatus(task);
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') return s !== 'done';
        if (statusFilter === 'done') return s === 'done';
        return true;
    }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const canSeeResponsible = [1, 10, 20, 30].includes(Number(user?.roleId));

    const TaskRow = ({ task }) => {
        const s = getTaskStatus(task);
        const lead = task.Lead;
        const stage = lead ? (STAGE_CONFIG[lead.status] || STAGE_CONFIG['new']) : null;
        const responsibleName = task.User?.name || task.responsible;

        const statusColor = s === 'done' ? '#34C759' : (s === 'overdue' ? '#FF3B30' : '#FF9500');

        // Base Card Style
        const cardStyle = {
            borderLeft: `5px solid ${stage ? stage.color : statusColor}`,
            background: stage ? stage.bg : '#fff',
            marginBottom: '8px',
            borderRadius: '16px',
            padding: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'start',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s, box-shadow 0.2s'
        };

        return (
            <div
                className={`task-ios-card ${s === 'done' ? 'task-done' : ''}`}
                style={cardStyle}
                onClick={() => handleTaskClick(task)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
            >
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        if (task.Lead?.id || task.leadId) {
                            navigate('/crm', { state: { openLeadId: task.Lead?.id || task.leadId } });
                        }
                    }}
                    style={{
                        marginTop: '2px',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'rgba(0, 122, 255, 0.1)',
                        color: '#007AFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(0, 122, 255, 0.2)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#007AFF'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 122, 255, 0.1)'; e.currentTarget.style.color = '#007AFF'; }}
                    title="Ir para a tarefa"
                >
                    <ArrowRight size={14} strokeWidth={2.5} />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontWeight: '900', fontSize: '15px', color: '#1c1c1e', margin: 0 }}>{task.title}</h4>
                        {task.priority === 'high' && <AlertTriangle size={14} color="#FF3B30" />}
                        {canSeeResponsible && responsibleName && (
                            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                                Resp: {responsibleName.split(' ')[0]}
                            </span>
                        )}
                    </div>

                    {lead && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', fontWeight: '800', color: '#48484a' }}>
                                {lead.name}
                            </span>
                            <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>
                                • {(lead.source === 'Organic' ? 'Orgânico' : (lead.source || 'Orgânico'))}
                            </span>
                            {lead.aiStatus === 'rescue' && (
                                <div style={{ background: '#eff6ff', color: '#3b82f6', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="IA Monitorando">
                                    <Brain size={14} />
                                </div>
                            )}
                            {stage && (
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: stage.color,
                                    color: '#fff',
                                    textTransform: 'uppercase'
                                }}>
                                    {stage.label}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ textAlign: 'right', minWidth: '90px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: statusColor, marginBottom: '2px' }}>
                        {s === 'done' ? 'CONCLUÍDA' : s === 'overdue' ? 'ATRASADA' : 'PENDENTE'}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        <br />
                        {new Date(task.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="tasks-page-layout">

            {/* Header com Filtros iOS */}
            <div className="filter-bar-ios">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <Filter size={18} color="#8E8E93" />
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: '800', fontSize: '13px', outline: 'none' }}>
                        <option value="pending">Pendentes</option>
                        <option value="all">Todas as Tarefas</option>
                        <option value="done">Concluídas</option>
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderRadius: '12px' }}>
                        <Calendar size={14} />
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700' }} />
                        <span>-</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700' }} />
                    </div>

                    {isGlobalUser && (
                        <select value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)} style={{ background: 'rgba(0,0,0,0.03)', border: 'none', fontWeight: '700', fontSize: '12px', padding: '6px 12px', borderRadius: '12px' }}>
                            <option value="">Brasil (Geral)</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}

                    <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ height: '36px', padding: '0 16px', borderRadius: '14px', fontSize: '13px' }}>
                        <Plus size={16} /> Nova
                    </button>
                </div>
            </div>

            {/* Lista Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5 }}>Carregando agenda premium...</div>
                ) : filteredTasks.length > 0 ? (
                    filteredTasks.map(task => <TaskRow key={task.id} task={task} />)
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.5)', borderRadius: '24px', border: '2px dashed rgba(0,0,0,0.05)', color: '#8E8E93' }}>
                        <CheckSquare size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                        <p style={{ fontWeight: '800' }}>Parabéns! Nenhuma tarefa encontrada.</p>
                    </div>
                )}
            </div>

            {/* Modais */}
            {taskLeadId && fetchedLead && (
                <LeadDetailsModal
                    isOpen={true}
                    onClose={() => { setTaskLeadId(null); setFetchedLead(null); }}
                    lead={fetchedLead}
                    onUpdate={fetchTasks}
                    user={user}
                />
            )}

            {viewTask && (
                <VoxModal
                    isOpen={true}
                    onClose={() => { setViewTask(null); setTaskLeadId(null); setFetchedLead(null); }}
                    title={viewTask.title}
                >
                    <div style={{ padding: '8px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '12px' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Vencimento</div>
                                <div style={{ fontWeight: '800', fontSize: '14px' }}>{new Date(viewTask.dueDate).toLocaleString('pt-BR')}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Categoria</div>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#6366f1' }}>
                                    {viewTask.category === 'commercial' ? 'Comercial' : viewTask.category === 'pedagogical' ? 'Pedagógico' : 'Administrativo'}
                                </div>
                            </div>
                        </div>

                        {fetchedLead && (
                            <div style={{ marginBottom: '20px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>{fetchedLead.name}</h5>
                                    {STAGE_CONFIG[fetchedLead.status] && (
                                        <span style={{
                                            fontSize: '10px',
                                            fontWeight: '900',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            background: STAGE_CONFIG[fetchedLead.status].color,
                                            color: '#fff'
                                        }}>
                                            {STAGE_CONFIG[fetchedLead.status].label}
                                        </span>
                                    )}
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Fonte: {fetchedLead.source || 'Orgânico'}</p>

                                <button
                                    onClick={() => {
                                        navigate('/crm', { state: { openLeadId: fetchedLead.id } });
                                    }}
                                    className="btn-primary"
                                    style={{ marginTop: '12px', width: 'auto', padding: '8px 16px', height: '36px', fontSize: '12px' }}
                                >
                                    Ver no CRM
                                </button>
                            </div>
                        )}

                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Observações da Tarefa</div>
                            <div style={{
                                padding: '16px',
                                background: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                minHeight: '60px',
                                fontSize: '14px',
                                color: '#475569',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap',
                                marginBottom: '16px'
                            }}>
                                {viewTask.description || 'Nenhuma observação registrada.'}
                            </div>

                            {(fetchedLead?.observation || fetchedLead?.notes) && (
                                <>
                                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Notas do Lead</div>
                                    <div style={{
                                        padding: '16px',
                                        background: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        fontSize: '13px',
                                        color: '#64748b',
                                        lineHeight: '1.5',
                                        whiteSpace: 'pre-wrap',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        {fetchedLead.observation && <div>{fetchedLead.observation}</div>}
                                        {fetchedLead.notes && fetchedLead.notes !== fetchedLead.observation && (
                                            <div style={{ paddingTop: fetchedLead.observation ? '12px' : 0, borderTop: fetchedLead.observation ? '1px dashed #e2e8f0' : 'none' }}>
                                                {fetchedLead.notes}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {fetchedLead && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '12px' }}>Histórico e Tarefas Concluídas</div>
                                <div style={{
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    padding: '12px',
                                    background: '#f1f5f9',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px'
                                }}>
                                    {/* History Logs */}
                                    {(() => {
                                        let history = [];
                                        try { history = JSON.parse(fetchedLead.history || '[]'); } catch (e) { }
                                        return history.slice(0, 5).map((log, i) => (
                                            <div key={`h-${i}`} style={{ fontSize: '12px', padding: '8px', background: '#fff', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                                                <div style={{ fontWeight: '800', fontSize: '10px', color: '#94a3b8' }}>{new Date(log.date).toLocaleString('pt-BR')}</div>
                                                <div style={{ color: '#475569' }}>{log.content}</div>
                                            </div>
                                        ));
                                    })()}

                                    {/* Completed Tasks */}
                                    {fetchedLead.tasks?.filter(t => t.status === 'done').map(t => (
                                        <div key={t.id} style={{ fontSize: '12px', padding: '8px', background: '#fff', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                                            <div style={{ fontWeight: '800', fontSize: '10px', color: '#94a3b8' }}>Concluída em: {new Date(t.updatedAt).toLocaleString('pt-BR')}</div>
                                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{t.title}</div>
                                            {t.description && <div style={{ color: '#64748b', fontSize: '11px' }}>{t.description}</div>}
                                        </div>
                                    ))}

                                    {(!fetchedLead.tasks?.some(t => t.status === 'done') && JSON.parse(fetchedLead.history || '[]').length === 0) && (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>Sem histórico disponível.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => handleOpenTaskAction(viewTask)} className="btn-primary" style={{ flex: 1 }}>
                                Abrir Tarefa
                            </button>
                            <button onClick={() => setViewTask(null)} style={{ flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid #e5e5ea', background: '#fff', fontWeight: '800', color: '#48484a' }}>
                                Fechar Janela
                            </button>
                        </div>
                    </div>
                </VoxModal>
            )}

            {isModalOpen && (
                <VoxModal isOpen={true} onClose={() => setIsModalOpen(false)} title="Nova Tarefa">
                    <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <input placeholder="Título da Tarefa" required className="input-field" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                        <textarea placeholder="Descrição..." className="input-field" rows="3" value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="date" className="input-field" value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                            <input type="time" className="input-field" value={newTask.dueTime} onChange={e => setNewTask({ ...newTask, dueTime: e.target.value })} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <select className="input-field" value={newTask.category} onChange={e => setNewTask({ ...newTask, category: e.target.value })}>
                                <option value="administrative">Administrativo</option>
                                <option value="pedagogical">Pedagógico</option>
                                <option value="commercial">Comercial</option>
                            </select>
                            <select className="input-field" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}>
                                <option value="low">Prioridade Baixa</option>
                                <option value="medium">Prioridade Média</option>
                                <option value="high">Prioridade Alta</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '12px', height: '50px' }}>Criar Agora</button>
                    </form>
                </VoxModal>
            )}

            {showEnrollmentWizard && (
                <EnrollmentWizard
                    classes={classes}
                    initialData={fetchedLead}
                    onClose={() => setShowEnrollmentWizard(false)}
                    onSave={() => {
                        setShowEnrollmentWizard(false);
                        fetchTasks();
                    }}
                />
            )}

        </div>
    );
};

export default TasksPage;
