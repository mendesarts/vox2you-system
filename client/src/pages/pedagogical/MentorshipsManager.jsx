import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Clock, CheckCircle, XCircle, Search, Plus, User, GraduationCap, Edit, Trash2 } from 'lucide-react';
import { VoxModal } from '../../components/VoxUI';

const MentorshipsManager = () => {
    const [students, setStudents] = useState([]);
    const [filter, setFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [classesFilter, setClassesFilter] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const [mentorshipForm, setMentorshipForm] = useState({
        date: '',
        time: '',
        notes: '',
        status: 'scheduled',
        mentorId: ''
    });
    const [mentors, setMentors] = useState([]);
    const [editingMentorshipId, setEditingMentorshipId] = useState(null);

    useEffect(() => {
        fetchData();
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/mentors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMentors(data);
            }
        } catch (error) {
            console.error('Error fetching mentors:', error);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/students-mentorships`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
            } else {
                console.error('Failed to fetch mentorships:', res.status, res.statusText);
            }
        } catch (error) {
            console.error('Error fetching mentorships:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
        // We can't call resetForm here because currentStudentData isn't updated yet in the state
        // Instead, we initialize the form with student data directly
        const studentDetail = students.find(s => s.id === student.id);
        const defaultMentor = studentDetail?.professor?.canMentorship ? studentDetail.professor.id : '';

        setEditingMentorshipId(null);
        setMentorshipForm({
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            notes: '',
            status: 'scheduled',
            mentorId: defaultMentor
        });
    };

    const resetForm = () => {
        const defaultMentor = currentStudentData?.professor?.canMentorship ? currentStudentData.professor.id : '';
        setEditingMentorshipId(null);
        setMentorshipForm({
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            notes: '',
            status: 'scheduled',
            mentorId: defaultMentor
        });
    };

    const handleEditClick = (mentorship) => {
        setEditingMentorshipId(mentorship.id);
        const date = new Date(mentorship.scheduledDate);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setMentorshipForm({
            date: date.toISOString().split('T')[0],
            time: `${hours}:${minutes}`,
            notes: mentorship.notes || '',
            status: mentorship.status,
            mentorId: mentorship.mentorId || ''
        });
    };

    const handleSaveMentorship = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;

        const scheduledDate = new Date(`${mentorshipForm.date}T${mentorshipForm.time}`);
        const payload = {
            studentId: Number(selectedStudent.id),
            scheduledDate: scheduledDate.toISOString(),
            notes: mentorshipForm.notes,
            status: mentorshipForm.status,
            mentorId: mentorshipForm.mentorId ? Number(mentorshipForm.mentorId) : null
        };

        try {
            const token = localStorage.getItem('token');
            let url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/mentorship`;
            let method = 'POST';

            if (editingMentorshipId) {
                console.log('Editing Mentorship ID:', editingMentorshipId);
                url = `${url}/${editingMentorshipId}`;
                method = 'PUT';
            } else {
                console.log('Creating New Mentorship');
            }

            console.log('Request URL:', url);
            console.log('Request Payload:', payload);

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert(editingMentorshipId ? 'Mentoria atualizada!' : 'Mentoria registrada com sucesso!');
                if (editingMentorshipId) {
                    resetForm();
                } else {
                    setIsModalOpen(false);
                }
                fetchData();
            } else {
                alert('Erro ao salvar mentoria');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar mentoria');
        }
    };

    const handleDeleteMentorship = async (mentorshipId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta mentoria permanentemente?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/mentorship/${mentorshipId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchData();
            } else {
                alert('Erro ao excluir mentoria');
            }
        } catch (error) {
            console.error('Error deleting mentorship:', error);
        }
    };

    const handleUpdateStatus = async (mentorshipId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/mentorship/${mentorshipId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: action })
            });
            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const availableCourses = [...new Set(students.map(s => s.courseName))].filter(Boolean).sort();
    const availableClasses = [...new Set(
        students
            .filter(s => !courseFilter || s.courseName === courseFilter)
            .map(s => s.className)
    )].filter(Boolean).filter(c => c !== 'Sem Turma').sort();

    const filteredStudents = students.filter(s => {
        const matchesText = s.name.toLowerCase().includes(filter.toLowerCase()) ||
            s.courseName.toLowerCase().includes(filter.toLowerCase());
        const matchesCourse = courseFilter ? s.courseName === courseFilter : true;
        const matchesClass = classesFilter ? s.className === classesFilter : true;
        return matchesText && matchesCourse && matchesClass;
    });

    const currentStudentData = selectedStudent ? students.find(s => s.id === selectedStudent.id) : null;

    return (
        <div className="mentorships-manager page-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', margin: 0 }}>
                        <UserCheck size={24} color="var(--primary)" />
                        Gestão de Mentorias
                    </h3>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <select
                        value={courseFilter}
                        onChange={e => { setCourseFilter(e.target.value); setClassesFilter(''); }}
                        className="input-field"
                        style={{ width: '180px', cursor: 'pointer' }}
                    >
                        <option value="">Todos os Cursos</option>
                        {availableCourses.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <select
                        value={classesFilter}
                        onChange={e => setClassesFilter(e.target.value)}
                        className="input-field"
                        style={{ width: '180px', cursor: 'pointer' }}
                        disabled={!courseFilter && availableClasses.length === 0}
                    >
                        <option value="">Todas as Turmas</option>
                        {availableClasses.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '35px', width: '250px' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="finance-table-container">
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th>Curso / Turma</th>
                                <th style={{ textAlign: 'center' }}>Progresso</th>
                                <th style={{ textAlign: 'center' }}>Agendadas</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{student.name}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <span style={{ fontWeight: 600 }}>{student.courseName}</span>
                                            <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>•</span>
                                            <span>{student.className}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            background: student.remaining > 0 ? 'rgba(30, 27, 75, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: student.remaining > 0 ? 'var(--primary)' : '#ef4444'
                                        }}>
                                            {student.mentorshipsApplied} / {student.mentorshipsIncluded}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.85rem' }}>
                                            <Calendar size={14} color="#3b82f6" />
                                            <span>{student.mentorshipsScheduled}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleStudentClick(student)}
                                            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Plus size={14} /> {student.remaining > 0 ? 'Agendar' : 'Ver Histórico'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                        Nenhum aluno encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && currentStudentData && (
                <VoxModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    width="900px"
                    title={`Histórico e Agendamento: ${currentStudentData.name}`}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2rem' }}>
                        {/* Left: History */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={18} color="var(--ios-teal)" />
                                    Últimas Sessões
                                </h4>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                    {currentStudentData.courseName} | {currentStudentData.mentorshipsApplied} de {currentStudentData.mentorshipsIncluded}
                                </div>
                            </div>

                            <div className="custom-scrollbar" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                                {currentStudentData.mentorships && currentStudentData.mentorships.length > 0 ? (
                                    [...currentStudentData.mentorships].sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)).map(m => {
                                        const mDate = new Date(m.scheduledDate);
                                        // Colors mapping
                                        let bg = 'rgba(94, 92, 230, 0.05)';
                                        let color = '#5E5CE6'; // Scheduled
                                        let borderColor = 'rgba(94, 92, 230, 0.1)';
                                        let statusText = 'Agendada';

                                        if (m.status === 'completed') {
                                            bg = 'rgba(52, 199, 89, 0.05)';
                                            color = '#34C759';
                                            borderColor = 'rgba(52, 199, 89, 0.1)';
                                            statusText = 'Realizada';
                                        } else if (m.status === 'cancelled') {
                                            bg = 'rgba(255, 59, 48, 0.05)';
                                            color = '#FF3B30';
                                            borderColor = 'rgba(255, 59, 48, 0.1)';
                                            statusText = 'Cancelada';
                                        }

                                        return (
                                            <div key={m.id} style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${borderColor}`, background: bg, marginBottom: '12px', transition: 'all 0.2s ease' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                                            <Calendar size={14} />
                                                            {mDate.toLocaleDateString('pt-BR')} às {mDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                        <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', opacity: 0.7, letterSpacing: '0.5px', color: 'var(--text-muted)' }}>
                                                            Mentor: {m.mentor?.name || 'Não atribuído'}
                                                        </div>
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '6px', background: 'white', border: `1px solid ${color}`, color: color }}>
                                                        {statusText}
                                                    </span>
                                                </div>

                                                {m.notes && <p style={{ fontSize: '0.85rem', fontStyle: 'italic', opacity: 0.8, marginBottom: '12px', color: 'var(--text-main)', lineHeight: '1.4' }}>"{m.notes}"</p>}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${borderColor}`, paddingTop: '12px', marginTop: '8px' }}>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {m.status === 'scheduled' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(m.id, 'completed')}
                                                                    style={{ fontSize: '10px', fontWeight: 'bold', padding: '6px 12px', background: '#34C759', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                                                >
                                                                    Concluir
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(m.id, 'cancelled')}
                                                                    style={{ fontSize: '10px', fontWeight: 'bold', padding: '6px 12px', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => handleEditClick(m)}
                                                            className="btn-icon"
                                                            style={{ padding: '6px', background: 'white', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', color: '#8E8E93' }}
                                                            title="Editar"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteMentorship(m.id)}
                                                            className="btn-icon"
                                                            style={{ padding: '6px', background: 'white', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', color: '#FF3B30' }}
                                                            title="Excluir"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '48px 0', background: 'var(--bg-app)', borderRadius: '16px', border: '2px dashed var(--border)' }}>
                                        <Calendar size={32} style={{ margin: '0 auto 10px auto', color: 'var(--text-muted)' }} />
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma mentoria registrada.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: New/Edit Form */}
                        <div className="vox-card" style={{ height: 'fit-content', position: 'sticky', top: 0, padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h4 style={{ fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={18} color="var(--ios-teal)" />
                                    {editingMentorshipId ? 'Editar Detalhes' : 'Novo Agendamento'}
                                </h4>
                                {editingMentorshipId && (
                                    <button onClick={resetForm} style={{ fontSize: '10px', fontWeight: 'bold', color: '#5E5CE6', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                                        Cancelar Edição
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleSaveMentorship} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Data</label>
                                        <input
                                            type="date" required
                                            value={mentorshipForm.date}
                                            onChange={e => setMentorshipForm({ ...mentorshipForm, date: e.target.value })}
                                            className="input-field"
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Hora</label>
                                        <input
                                            type="time" required
                                            value={mentorshipForm.time}
                                            onChange={e => setMentorshipForm({ ...mentorshipForm, time: e.target.value })}
                                            className="input-field"
                                            style={{ fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Observações / Tema</label>
                                    <textarea
                                        rows="3"
                                        value={mentorshipForm.notes}
                                        onChange={e => setMentorshipForm({ ...mentorshipForm, notes: e.target.value })}
                                        className="input-field"
                                        style={{ fontSize: '0.9rem', resize: 'none' }}
                                        placeholder="Ex: Feedback sobre dicção..."
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Status</label>
                                    <select
                                        value={mentorshipForm.status}
                                        onChange={e => setMentorshipForm({ ...mentorshipForm, status: e.target.value })}
                                        className="input-field"
                                        style={{ fontSize: '0.9rem' }}
                                    >
                                        <option value="scheduled">Agendado</option>
                                        <option value="completed">Realizado</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>
                                        Responsável (Mentor)
                                    </label>
                                    <select
                                        required
                                        value={mentorshipForm.mentorId}
                                        onChange={e => setMentorshipForm({ ...mentorshipForm, mentorId: e.target.value })}
                                        className="input-field"
                                        style={{ fontSize: '0.9rem', border: !mentorshipForm.mentorId ? '1px solid #FF3B30' : undefined, background: !mentorshipForm.mentorId ? 'rgba(255, 59, 48, 0.05)' : undefined }}
                                    >
                                        <option value="">Selecione um Mentor...</option>
                                        {mentors.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    {!mentorshipForm.mentorId && (
                                        <p style={{ fontSize: '10px', color: '#FF3B30', fontWeight: '600', marginTop: '4px' }}>Campo obrigatório.</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ width: '100%', marginTop: '8px' }}
                                >
                                    {editingMentorshipId ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                                </button>
                            </form>
                        </div>
                    </div>
                </VoxModal>
            )}

            <style>{`
            .student-card:hover {
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            `}</style>
        </div>
    );
};

export default MentorshipsManager;
