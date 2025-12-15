import React, { useState, useEffect } from 'react';
import { UserCheck, Calendar, Clock, CheckCircle, XCircle, Search, Plus, User } from 'lucide-react';

const MentorshipsManager = () => {
    const [students, setStudents] = useState([]);
    const [filter, setFilter] = useState('');
    const [classesFilter, setClassesFilter] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mentorshipForm, setMentorshipForm] = useState({
        date: '',
        time: '',
        notes: '',
        status: 'scheduled'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/pedagogical/students-mentorships');
            if (res.ok) {
                const data = await res.json();
                setStudents(data);
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
        // Reset form or preload if needed?
        // Let's reset for a NEW mentorship.
        // But also we need to see EXISTING mentorships.
        setMentorshipForm({
            date: new Date().toISOString().split('T')[0],
            time: '10:00',
            notes: '',
            status: 'scheduled'
        });
    };

    const handleSaveMentorship = async (e) => {
        e.preventDefault();
        if (!selectedStudent) return;

        const scheduledDate = new Date(`${mentorshipForm.date}T${mentorshipForm.time}`);

        try {
            const res = await fetch('http://localhost:3000/api/pedagogical/mentorship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: selectedStudent.id,
                    scheduledDate: scheduledDate,
                    notes: mentorshipForm.notes,
                    status: mentorshipForm.status
                })
            });

            if (res.ok) {
                alert('Mentoria registrada com sucesso!');
                setIsModalOpen(false);
                fetchData();
            } else {
                alert('Erro ao registrar mentoria');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao registrar mentoria');
        }
    };

    const handleUpdateStatus = async (mentorshipId, newStatus) => {
        try {
            const res = await fetch(`http://localhost:3000/api/pedagogical/mentorship/${mentorshipId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                // Update local state is tricky because we fetch all.
                // Just refresh all for now.
                fetchData();
                // If modal is open, we need to refresh selected student's list too...
                // But selectedStudent is a static copy? 
                // We should re-find the student in the new data if modal is open.
                // Or just close modal.
            }
        } catch (error) {
            console.error(error);
        }
    };

    const availableClasses = [...new Set(students.map(s => s.className))].filter(Boolean).filter(c => c !== 'Sem Turma').sort();

    const filteredStudents = students.filter(s => {
        const matchesText = s.name.toLowerCase().includes(filter.toLowerCase()) ||
            s.courseName.toLowerCase().includes(filter.toLowerCase());
        const matchesClass = classesFilter ? s.className === classesFilter : true;
        return matchesText && matchesClass;
    });

    // Helper to get fresh data for modal
    const currentStudentData = selectedStudent ? students.find(s => s.id === selectedStudent.id) : null;

    return (
        <div className="mentorships-manager page-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                    <UserCheck size={24} color="var(--primary)" />
                    Gestão de Mentorias
                </h3>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <select
                        value={classesFilter}
                        onChange={e => setClassesFilter(e.target.value)}
                        className="input-field"
                        style={{ width: '200px', cursor: 'pointer' }}
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
                            placeholder="Buscar aluno ou curso..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '35px', width: '300px' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="students-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {filteredStudents.map(student => (
                        <div
                            key={student.id}
                            className="control-card student-card"
                            onClick={() => handleStudentClick(student)}
                            style={{
                                cursor: 'pointer',
                                borderLeft: `4px solid ${student.remaining > 0 ? '#10b981' : '#ef4444'}`,
                                transition: 'transform 0.2s',
                                ':hover': { transform: 'translateY(-2px)' }
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{student.name}</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.className !== 'Sem Turma' ? student.className + ' • ' : ''}{student.courseName}</span>
                                </div>
                                <div style={{
                                    background: 'var(--bg-app)',
                                    padding: '5px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    color: student.remaining > 0 ? 'var(--primary)' : 'var(--text-muted)'
                                }}>
                                    {student.mentorshipsApplied}/{student.mentorshipsIncluded}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <CheckCircle size={14} color="#10b981" />
                                    <span>{student.mentorshipsApplied} Realizadas</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Calendar size={14} color="#3b82f6" />
                                    <span>{student.mentorshipsScheduled} Agendadas</span>
                                </div>
                            </div>

                            {student.remaining > 0 && (
                                <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border)', textAlign: 'center', color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                    + Agendar Nova Mentoria
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && currentStudentData && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h3>Mentorias: {currentStudentData.name}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>{currentStudentData.courseName} — Disponíveis: {currentStudentData.remaining}</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><XCircle size={24} /></button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
                            {/* Left: History */}
                            <div>
                                <h4 style={{ marginBottom: '15px' }}>Histórico</h4>
                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {currentStudentData.mentorships && currentStudentData.mentorships.length > 0 ? (
                                        currentStudentData.mentorships.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)).map(m => (
                                            <div key={m.id} style={{
                                                marginBottom: '10px',
                                                padding: '10px',
                                                background: 'var(--bg-app)',
                                                borderRadius: '6px',
                                                borderLeft: `3px solid ${m.status === 'completed' ? '#10b981' :
                                                    m.status === 'cancelled' ? '#ef4444' : '#3b82f6'
                                                    }`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                                    <strong>{new Date(m.scheduledDate).toLocaleDateString()} {new Date(m.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                                    <span style={{
                                                        fontSize: '0.8rem',
                                                        background: 'var(--bg-surface)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        {m.status === 'completed' ? 'Realizada' :
                                                            m.status === 'cancelled' ? 'Cancelada' : 'Agendada'}
                                                    </span>
                                                </div>
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>{m.notes || 'Sem observações.'}</p>

                                                {m.status === 'scheduled' && (
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => handleUpdateStatus(m.id, 'cancelled')}
                                                            style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(m.id, 'completed')}
                                                            style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Concluir
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)' }}>Nenhuma mentoria registrada.</p>
                                    )}
                                </div>
                            </div>

                            {/* Right: New Form */}
                            <div style={{ background: 'var(--bg-surface-hover)', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
                                <h4 style={{ marginBottom: '15px' }}>Nova Mentoria</h4>
                                <form onSubmit={handleSaveMentorship}>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Data</label>
                                        <input
                                            type="date" required
                                            value={mentorshipForm.date}
                                            onChange={e => setMentorshipForm({ ...mentorshipForm, date: e.target.value })}
                                            className="input-field" style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Hora</label>
                                        <input
                                            type="time" required
                                            value={mentorshipForm.time}
                                            onChange={e => setMentorshipForm({ ...mentorshipForm, time: e.target.value })}
                                            className="input-field" style={{ width: '100%' }}
                                        />
                                    </div>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Observações</label>
                                        <textarea
                                            rows="4"
                                            value={mentorshipForm.notes}
                                            onChange={e => setMentorshipForm({ ...mentorshipForm, notes: e.target.value })}
                                            className="input-field" style={{ width: '100%' }}
                                            placeholder="Tema a ser abordado..."
                                        ></textarea>
                                    </div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem' }}>Status Inicial</label>
                                        <select
                                            value={mentorshipForm.status}
                                            onChange={e => setMentorshipForm({ ...mentorshipForm, status: e.target.value })}
                                            className="input-field" style={{ width: '100%' }}
                                        >
                                            <option value="scheduled">Agendado</option>
                                            <option value="completed">Realizado Agora</option>
                                        </select>
                                    </div>

                                    <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                                        Confirmar Agendamento
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
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
