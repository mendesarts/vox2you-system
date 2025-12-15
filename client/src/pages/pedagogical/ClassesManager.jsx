import React, { useState, useEffect } from 'react';
import { Plus, Users, Calendar, RefreshCw, X, Edit, Trash2, Filter } from 'lucide-react';
import { fetchUsers } from '../../services/api';
import Toast from '../../components/Toast';

const ClassesManager = ({ onNavigateToStudents }) => {
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
            const res = await fetch('http://localhost:3000/api/classes');
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/courses');
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
                // Filter for potential teachers
                const teachers = data.filter(u => ['admin', 'consultant', 'pedagogical'].includes(u.role));
                setProfessors(teachers);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchClasses();
        fetchCourses();
        loadProfessors();
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

    // Delete class
    const handleDeleteClass = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta turma?')) return;
        try {
            const res = await fetch(`http://localhost:3000/api/classes/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setToast({ message: 'Turma excluída.', type: 'success' });
                fetchClasses();
            } else {
                setToast({ message: 'Erro ao excluir.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        }
    };

    // Create or Update Class
    const handleSaveClass = async (e) => {
        e.preventDefault();
        const url = editingClassId
            ? `http://localhost:3000/api/classes/${editingClassId}`
            : 'http://localhost:3000/api/classes';

        const method = editingClassId ? 'PUT' : 'POST';

        try {
            const payload = {
                ...newClass,
                professorId: newClass.professorId === '' ? null : newClass.professorId,
                courseId: newClass.courseId === '' ? null : newClass.courseId,
                days: JSON.stringify(newClass.days) // Serialize days array
            };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setToast({ message: editingClassId ? 'Turma atualizada!' : 'Turma criada!', type: 'success' });
                setIsModalOpen(false);
                resetForm();
                fetchClasses();
            } else {
                const data = await res.json();
                setToast({ message: data.error || 'Erro ao salvar turma.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        }
    };

    const resetForm = () => {
        setEditingClassId(null);
        setNewClass({ courseId: '', name: '', classNumber: '', startDate: '', startTime: '', endTime: '', days: [], capacity: 20, professorId: '', status: 'planned' });
    };

    const handleGenerateSchedule = async (classId) => {
        if (!window.confirm('Isso irá gerar/regenerar o cronograma de aulas baseando-se nos feriados cadastrados. Continuar?')) return;
        try {
            const res = await fetch(`http://localhost:3000/api/classes/${classId}/generate-schedule`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setToast({ message: `Cronograma gerado! ${data.count} aulas agendadas.`, type: 'success' });
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
                <button className="btn-primary" onClick={() => { resetForm(); setIsModalOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                    <Plus size={16} /> Nova Turma
                </button>
            </div>

            {/* Filters */}
            <div className="control-card" style={{ marginBottom: '20px', padding: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>Filtros:</span>
                </div>
                <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
                    <option value="">Status: Todos</option>
                    <option value="active">Ativa</option>
                    <option value="planned">Pré-matrícula</option>
                    <option value="finished">Encerrada</option>
                </select>
                <select className="input-field" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
                    <option value="">Curso: Todos</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input-field" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ padding: '8px', minWidth: '150px' }}>
                    <option value="">Mês de Início: Todos</option>
                    {uniqueMonths.map(m => <option key={m} value={m}>{m.split('-').reverse().join('/')}</option>)}
                </select>
                {(filterStatus || filterCourse || filterMonth) && (
                    <button onClick={() => { setFilterStatus(''); setFilterCourse(''); setFilterMonth(''); }} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.9rem' }}>
                        Limpar Filtros
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {filteredClasses.map(cls => (
                    <div key={cls.id} className="control-card" style={{ borderLeft: `4px solid ${getStatusColor(cls.status)}` }}>
                        <div className="card-header" style={{ justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {cls.Course?.name || 'Curso não definido'}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: `${getStatusColor(cls.status)}20`, color: getStatusColor(cls.status), fontWeight: 'bold' }}>
                                        {getStatusLabel(cls.status)}
                                    </span>
                                </div>
                                <h4 style={{ color: 'var(--text-main)', margin: 0 }}>{cls.name} <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>#{cls.classNumber}</span></h4>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="icon-btn" onClick={() => handleEditClass(cls)} title="Editar">
                                    <Edit size={16} style={{ color: 'var(--primary)' }} />
                                </button>
                                <button className="icon-btn" onClick={() => handleDeleteClass(cls.id)} title="Excluir">
                                    <Trash2 size={16} style={{ color: 'var(--error)' }} />
                                </button>
                            </div>
                        </div>
                        <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <Users size={14} /> Prof. {cls.professor?.name || 'Não atribuído'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} /> {cls.startTime && cls.endTime ? `${cls.startTime} - ${cls.endTime}` : 'Sem horário'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: cls.Students?.length >= cls.capacity ? 'var(--error)' : 'var(--success)' }}>
                                <Users size={14} /> {cls.Students?.length || 0}/{cls.capacity} Alunos
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span>Capacidade: {cls.capacity}</span>
                            <span>Início: {cls.startDate ? cls.startDate.split('-').reverse().join('/') : '-'}</span>
                        </div>
                        <div className="action-list" style={{ marginTop: '15px' }}>
                            <button className="action-btn" onClick={() => onNavigateToStudents && onNavigateToStudents(cls.id)}>Ver Alunos</button>
                            <button className="action-btn" onClick={() => handleGenerateSchedule(cls.id)} title="Gerar Cronograma">
                                <RefreshCw size={14} style={{ marginRight: '5px' }} /> Cronograma
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Nova Turma */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingClassId ? 'Editar Turma' : 'Nova Turma'}</h3>
                            <button onClick={() => { setIsModalOpen(false); resetForm(); }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSaveClass}>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status da Turma</label>
                                <select
                                    className="input-field"
                                    value={newClass.status}
                                    onChange={e => setNewClass({ ...newClass, status: e.target.value })}
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="planned">Pré-matrícula</option>
                                    <option value="active">Ativa</option>
                                    <option value="finished">Encerrada</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Curso</label>
                                <select
                                    required
                                    className="input-field"
                                    value={newClass.courseId}
                                    onChange={e => setNewClass({ ...newClass, courseId: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                                >
                                    <option value="">Selecione um curso...</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option> // Use c.name based on Course model
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Professor Responsável</label>
                                <select
                                    className="input-field"
                                    value={newClass.professorId}
                                    onChange={e => setNewClass({ ...newClass, professorId: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                                >
                                    <option value="">Selecione um professor...</option>
                                    {professors.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Nome da Turma</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Ex: Turma Alpha"
                                        className="input-field"
                                        value={newClass.name}
                                        onChange={e => setNewClass({ ...newClass, name: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Número da Turma</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 101"
                                        className="input-field"
                                        value={newClass.classNumber}
                                        onChange={e => setNewClass({ ...newClass, classNumber: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Data de Início</label>
                                    <input
                                        required
                                        type="date"
                                        className="input-field"
                                        value={newClass.startDate}
                                        onChange={e => setNewClass({ ...newClass, startDate: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Limite de Alunos</label>
                                    <input
                                        required
                                        type="number"
                                        className="input-field"
                                        value={newClass.capacity}
                                        onChange={e => setNewClass({ ...newClass, capacity: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Horário Início</label>
                                    <input
                                        required
                                        type="time"
                                        className="input-field"
                                        value={newClass.startTime}
                                        onChange={e => setNewClass({ ...newClass, startTime: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Horário Fim</label>
                                    <input
                                        required
                                        type="time"
                                        className="input-field"
                                        value={newClass.endTime}
                                        onChange={e => setNewClass({ ...newClass, endTime: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px' }}>Dias de Aula</label>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                                        <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                            <input
                                                type="checkbox"
                                                checked={newClass.days.includes(day)}
                                                onChange={e => {
                                                    const newDays = e.target.checked
                                                        ? [...newClass.days, day]
                                                        : newClass.days.filter(d => d !== day);
                                                    setNewClass({ ...newClass, days: newDays });
                                                }}
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">{editingClassId ? 'Salvar' : 'Criar Turma'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClassesManager;
