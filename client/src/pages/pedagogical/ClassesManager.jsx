import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, RefreshCw, X, Edit, Trash2, Filter } from 'lucide-react';
import { VoxModal } from '../../components/VoxUI';
import { fetchUsers } from '../../services/api';
import Toast from '../../components/Toast';
import { useAuth } from '../../context/AuthContext';

const ClassesManager = ({ onNavigateToStudents }) => {
    const { user } = useAuth();
    const isGlobal = user && [1, 10].includes(user.roleId);

    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClassId, setEditingClassId] = useState(null); // Track editing state
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    const [newClass, setNewClass] = useState({
        courseId: '',
        name: '',
        classNumber: '',
        startDate: '',
        startTime: '',
        endTime: '',
        days: [],
        capacity: 20,
        professorId: '',
        status: 'planned'
    });

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                setClasses(data);
            } else {
                console.error('Invalid classes data:', data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Smart Day Selection
    useEffect(() => {
        if (newClass.startDate) {
            const d = new Date(newClass.startDate + 'T12:00:00');
            const dayMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
            const dayStr = dayMap[d.getDay()];

            // Replace days with the new day (User request: desmarcar anterior)
            setNewClass(prev => ({ ...prev, days: [dayStr] }));
        }
    }, [newClass.startDate]);

    const loadCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCourses(data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const loadProfessors = async () => {
        try {
            const data = await fetchUsers();
            if (Array.isArray(data)) {
                // Filter for potential teachers (Primary Role OR Secondary Role)
                const teachers = data.filter(u => {
                    // 1. Primary Role Check: Strict (50 or 51)
                    if ([50, 51].includes(Number(u.roleId))) return true;

                    // 2. Secondary Role Check: Check for 50 or 51 in accumulated functions
                    let roles = u.secondaryRoles;
                    if (typeof roles === 'string') {
                        try { roles = JSON.parse(roles); } catch (e) { roles = []; }
                    }
                    const secArray = Array.isArray(roles) ? roles.map(Number) : [];
                    return secArray.some(r => [50, 51].includes(r));
                });
                setProfessors(teachers);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const [holidays, setHolidays] = useState([]);

    const fetchHolidays = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/holidays`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setHolidays(data || []);
        } catch (error) {
            console.error('Error fetching holidays:', error);
        }
    };

    useEffect(() => {
        fetchClasses();
        loadCourses();
        loadProfessors();
        fetchHolidays();
    }, []);

    // Open modal to edit existing class
    const handleEditClass = (cls) => {
        let days = [];
        try {
            days = JSON.parse(cls.days || '[]');
        } catch (e) {
            console.error('Error parsing days:', e);
        }

        setEditingClassId(cls.id);
        setNewClass({
            courseId: cls.courseId || '',
            name: cls.name,
            classNumber: cls.classNumber || '',
            startDate: cls.startDate || '',
            startTime: cls.startTime || '',
            endTime: cls.endTime || '',
            days: days,
            capacity: cls.capacity,
            professorId: cls.professorId || '',
            status: cls.status || 'planned'
        });
        setIsModalOpen(true);
    };

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [classToDelete, setClassToDelete] = useState(null);

    // Initial Delete Click
    const handleDeleteClick = (cls) => {
        setClassToDelete(cls);
        setIsDeleteModalOpen(true);
    };

    // Execute Delete
    const confirmDelete = async () => {
        if (!classToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes/${classToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setToast({ message: 'Turma excluída.', type: 'success' });
                fetchClasses();
                setIsDeleteModalOpen(false);
                setClassToDelete(null);
            } else {
                setToast({ message: 'Erro ao excluir.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        }
    };

    // Create or Update Class
    const handleSaveClass = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // Manual Validation
        if (!newClass.courseId) return setToast({ message: 'Selecione um curso.', type: 'warning' });
        if (!newClass.startDate) return setToast({ message: 'Defina a data de início.', type: 'warning' });

        // Holiday Check
        const isOnHoliday = holidays.find(h => {
            const start = h.startDate;
            const end = h.endDate || h.startDate;
            return newClass.startDate >= start && newClass.startDate <= end;
        });

        if (isOnHoliday) {
            const confirm = window.confirm(
                `Atenção: A data de início (${newClass.startDate.split('-').reverse().join('/')}) coincide com o ${isOnHoliday.type === 'recess' ? 'recesso' : 'feriado'} "${isOnHoliday.name}".\n\nDeseja criar a turma assim mesmo? O sistema pulará esse dia e agendará a primeira aula para o próximo dia útil disponível.`
            );
            if (!confirm) return;
        }

        const url = editingClassId
            ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes/${editingClassId}`
            : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes`;

        const method = editingClassId ? 'PUT' : 'POST';

        try {
            const payload = {
                ...newClass,
                name: newClass.name.trim() || 'Turma (A Definir)',
                capacity: Number(newClass.capacity),
                professorId: newClass.professorId === '' ? null : newClass.professorId,
                courseId: newClass.courseId === '' ? null : newClass.courseId,
                days: JSON.stringify(Array.isArray(newClass.days) ? newClass.days : []),
                unit: user?.unit
            };

            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json(); // Parse response to check for warnings
                if (data.warning) {
                    setToast({ message: data.warning, type: 'warning' });
                } else {
                    setToast({ message: editingClassId ? 'Turma atualizada!' : 'Turma criada!', type: 'success' });
                }

                await fetchClasses();
                resetForm();
                setIsModalOpen(false);
            } else {
                let errorMsg = 'Erro ao salvar a turma.';
                try {
                    const data = await res.json();
                    errorMsg = data.error || 'Erro desconhecido.';
                } catch (jsonError) {
                    console.error('JSON Parse Error:', jsonError);
                    try {
                        const text = await res.text(); // Try to get HTML/Text body
                        errorMsg = `Erro Servidor (${res.status}): ${text.substring(0, 60)}...`;
                    } catch (readError) {
                        errorMsg = `Erro HTTP ${res.status}`;
                    }
                }
                setToast({ message: errorMsg, type: 'error' });
            }
        } catch (error) {
            console.error('Error saving class:', error);
            setToast({ message: 'Erro de Rede: ' + (error.message || 'Falha na conexão'), type: 'error' });
        }
    };

    const resetForm = () => {
        setEditingClassId(null);
        setNewClass({ courseId: '', name: '', classNumber: '', startDate: '', startTime: '', endTime: '', days: [], capacity: 20, professorId: '', status: 'planned' });
    };

    const handleGenerateSchedule = async (classId) => {
        if (!window.confirm('Isso irá gerar/regenerar o cronograma de aulas baseando-se nos feriados cadastrados. Continuar?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes/${classId}/generate-schedule`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setToast({ message: `Cronograma gerado! ${data.count} aulas agendadas.`, type: 'success' });
                fetchClasses();
            } else {
                setToast({ message: data.error || 'Erro ao gerar cronograma', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão', type: 'error' });
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Ativa';
            case 'finished': return 'Encerrada';
            case 'planned': return 'Pré-matrícula';
            default: return status;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'var(--success)';
            case 'finished': return 'var(--text-muted)';
            case 'planned': return 'var(--warning)';
            default: return 'var(--text-main)';
        }
    };
    const uniqueMonths = [...new Set(classes.map(c => c.startDate ? c.startDate.substring(0, 7) : '').filter(Boolean))].sort();

    const canManage = user && [1, 10, 20, 30, 50].includes(user.roleId);

    // DEBUG: Force Show All
    // const filteredClasses = classes;
    const filteredClasses = classes.filter(cls => {
        const matchesStatus = filterStatus ? cls.status === filterStatus : true;
        const matchesCourse = filterCourse ? cls.courseId === filterCourse : true;
        const matchesMonth = filterMonth ? (cls.startDate && cls.startDate.startsWith(filterMonth)) : true;
        return matchesStatus && matchesCourse && matchesMonth;
    });

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <h3>Gestão de Turmas</h3>
                {/* Botão para abrir o modal de cadastro de uma nova turma */}
                {canManage && (
                    <button className="btn-primary flex items-center gap-2" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                        <Plus size={16} /> Nova Turma
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="filter-bar-ios">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} color="#8E8E93" />
                    <span style={{ fontWeight: '800', color: '#8E8E93', fontSize: '11px', textTransform: 'uppercase' }}>Filtros</span>
                </div>
                <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ margin: 0, padding: '8px 12px', minWidth: '150px', background: 'rgba(255,255,255,0.5)' }}>
                    <option value="">Status: Todos</option>
                    <option value="active">Ativa</option>
                    <option value="planned">Pré-matrícula</option>
                    <option value="finished">Encerrada</option>
                </select>
                <select className="input-field" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ margin: 0, padding: '8px 12px', minWidth: '150px', background: 'rgba(255,255,255,0.5)' }}>
                    <option value="">Curso: Todos</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input-field" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ margin: 0, padding: '8px 12px', minWidth: '150px', background: 'rgba(255,255,255,0.5)' }}>
                    <option value="">Mês de Início: Todos</option>
                    {uniqueMonths.map(m => <option key={m} value={m}>{m.split('-').reverse().join('/')}</option>)}
                </select>
                {(filterStatus || filterCourse || filterMonth) && (
                    <button onClick={() => { setFilterStatus(''); setFilterCourse(''); setFilterMonth(''); }} style={{ background: 'none', border: 'none', color: '#FF3B30', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                        Limpar
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filteredClasses.map(cls => (
                    <div key={cls.id} className="vox-card" style={{ padding: '20px', borderLeft: `5px solid ${getStatusColor(cls.status)}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ios-teal)', fontWeight: '900', marginBottom: '4px', letterSpacing: '0.5px' }}>
                                        {cls.Course?.name || 'Curso não definido'}
                                    </div>
                                    <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '6px', backgroundColor: `${getStatusColor(cls.status)}15`, color: getStatusColor(cls.status), fontWeight: '800', textTransform: 'uppercase' }}>
                                        {getStatusLabel(cls.status)}
                                    </span>
                                </div>
                                <h4 style={{ color: '#1C1C1E', margin: '4px 0 0 0', fontWeight: '800', fontSize: '18px' }}>{cls.name} <span style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '400' }}>#{cls.classNumber}</span></h4>
                            </div>
                            {canManage && (
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                                    <button
                                        onClick={() => handleEditClass(cls)}
                                        style={{
                                            background: 'rgba(52, 199, 89, 0.1)',
                                            color: '#34C759',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyItems: 'center'
                                        }}
                                        title="Editar"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(cls)}
                                        style={{
                                            background: 'rgba(255, 59, 48, 0.1)',
                                            color: '#FF3B30',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyItems: 'center'
                                        }}
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#3A3A3C' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <Users size={16} color="#8E8E93" /> Prof. {cls.professor?.name || 'Não atribuído'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Calendar size={16} color="#8E8E93" />
                                <span style={{ fontWeight: '500' }}>{cls.startDate ? cls.startDate.split('-').reverse().join('/') : '-'}</span>
                                <span style={{ color: '#8E8E93' }}>até</span>
                                <span style={{ fontWeight: '500' }}>{cls.endDate ? cls.endDate.split('-').reverse().join('/') : '-'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    color: cls.Students?.length >= cls.capacity ? '#FF3B30' : '#34C759',
                                    fontWeight: '700', fontSize: '12px',
                                    background: cls.Students?.length >= cls.capacity ? 'rgba(255, 59, 48, 0.1)' : 'rgba(52, 199, 89, 0.1)',
                                    padding: '2px 8px', borderRadius: '4px'
                                }}>
                                    {cls.Students?.length || 0}/{cls.capacity} Alunos
                                </div>
                                {cls.startTime && cls.endTime && (
                                    <>
                                        <span style={{ color: '#C7C7CC' }}>•</span>
                                        <span style={{ fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>
                                            {cls.startDate ? ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'][new Date(cls.startDate + 'T12:00:00').getDay()] : ''}
                                        </span>
                                        <span style={{ color: '#C7C7CC' }}>•</span>
                                        <span style={{ fontSize: '12px' }}>{cls.startTime.split(':')[0]}h - {cls.endTime.split(':')[0]}h</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="action-list" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button className="btn-secondary" style={{ flex: 1, fontSize: '13px', padding: '8px' }} onClick={() => onNavigateToStudents && onNavigateToStudents(cls.id)}>Ver Alunos</button>
                            {canManage && (
                                <button className="btn-secondary" style={{ flex: 1, fontSize: '13px', padding: '8px' }} onClick={() => handleGenerateSchedule(cls.id)} title="Recalcular levando em conta feriados">
                                    <RefreshCw size={14} style={{ marginRight: '5px' }} /> Cronograma
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Nova Turma */}
            <VoxModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={editingClassId ? 'Editar Turma' : 'Nova Turma'}
            >
                <form id="class-form" onSubmit={handleSaveClass}>
                    <div className="form-group" style={{ marginBottom: '15px' }}>
                        <label>Status da Turma</label>
                        <select
                            className="input-field"
                            value={newClass.status}
                            onChange={e => setNewClass({ ...newClass, status: e.target.value })}
                        >
                            <option value="planned">Pré-matrícula</option>
                            <option value="active">Ativa</option>
                            <option value="finished">Encerrada</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Curso</label>
                        <select
                            className="input-field"
                            value={newClass.courseId}
                            onChange={e => setNewClass({ ...newClass, courseId: e.target.value })}
                        >
                            <option value="">Selecione um curso...</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Professor Responsável</label>
                        <select
                            className="input-field"
                            value={newClass.professorId}
                            onChange={e => setNewClass({ ...newClass, professorId: e.target.value })}
                        >
                            <option value="">Selecione um professor...</option>
                            {professors.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label>Nome da Turma</label>
                            <input
                                type="text"
                                placeholder="Ex: Turma Alpha (Opcional)"
                                className="input-field"
                                value={newClass.name}
                                onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Número da Turma</label>
                            <input
                                type="text"
                                placeholder="Ex: 101"
                                className="input-field"
                                value={newClass.classNumber}
                                onChange={e => setNewClass({ ...newClass, classNumber: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label>Data de Início</label>
                            <input
                                type="date"
                                className="input-field"
                                value={newClass.startDate}
                                onChange={e => setNewClass({ ...newClass, startDate: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Limite de Alunos</label>
                            <input
                                type="number"
                                className="input-field"
                                value={newClass.capacity}
                                onChange={e => setNewClass({ ...newClass, capacity: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group">
                            <label>Horário Início</label>
                            <input
                                required
                                type="time"
                                className="input-field"
                                value={newClass.startTime}
                                onChange={e => setNewClass({ ...newClass, startTime: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Horário Fim</label>
                            <input
                                required
                                type="time"
                                className="input-field"
                                value={newClass.endTime}
                                onChange={e => setNewClass({ ...newClass, endTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Dia de Aula</label>
                        <div style={{ padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: 'none', color: '#1C1C1E', fontWeight: '500' }}>
                            {newClass.days.length > 0 ? newClass.days.join(', ') : 'Selecione a Data de Início'}
                            <small style={{ display: 'block', marginTop: '4px', fontStyle: 'italic', color: '#8E8E93' }}>(Calculado automaticamente pela data de início)</small>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
                        <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn-secondary">Cancelar</button>
                        <button type="button" onClick={handleSaveClass} className="btn-primary" style={{ background: 'var(--ios-teal)', color: 'white', border: 'none' }}>{editingClassId ? 'Salvar' : 'Criar Turma'}</button>
                    </div>
                </form>
            </VoxModal>

            {/* DELETE MODAL */}
            <VoxModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Excluir Turma"
                width="400px"
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                        <Trash2 color="#FF3B30" size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>Excluir Turma?</h3>
                    <p style={{ color: '#8E8E93', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                        Você está prestes a excluir a turma <strong>{classToDelete?.name}</strong>.
                        <br /><span style={{ color: '#FF3B30', fontWeight: '700', fontSize: '12px', marginTop: '8px', display: 'block' }}>Isso pode afetar alunos matriculados nesta turma.</span>
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="btn-primary"
                            style={{ background: '#FF3B30', color: 'white', boxShadow: '0 4px 10px rgba(255, 59, 48, 0.3)' }}
                        >
                            Confirmar Exclusão
                        </button>
                    </div>
                </div>
            </VoxModal>
        </div>
    );
};

export default ClassesManager;

