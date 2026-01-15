import React, { useState, useEffect } from 'react';
import { VoxModal } from '../components/VoxUI';
import { GraduationCap, Users, AlertCircle, CheckCircle } from 'lucide-react';

const EnrollmentModal = ({ isOpen, onClose, lead, onSuccess }) => {
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [classCapacity, setClassCapacity] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');

    // Fetch courses on mount
    useEffect(() => {
        if (isOpen) {
            fetchCourses();
        }
    }, [isOpen]);

    // Fetch classes when course is selected
    useEffect(() => {
        if (selectedCourse) {
            fetchClasses(selectedCourse);
        } else {
            setClasses([]);
            setSelectedClass('');
        }
    }, [selectedCourse]);

    // Fetch class capacity when class is selected
    useEffect(() => {
        if (selectedClass) {
            fetchClassCapacity(selectedClass);
        } else {
            setClassCapacity(null);
        }
    }, [selectedClass]);

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${API_URL}/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Erro ao carregar cursos');
        }
    };

    const fetchClasses = async (courseId) => {
        try {
            const res = await fetch(`${API_URL}/classes?courseId=${courseId}&status=active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setClasses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching classes:', err);
            setError('Erro ao carregar turmas');
        }
    };

    const fetchClassCapacity = async (classId) => {
        try {
            const res = await fetch(`${API_URL}/classes/${classId}/capacity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setClassCapacity(data);
        } catch (err) {
            console.error('Error fetching class capacity:', err);
        }
    };

    const handleEnroll = async () => {
        if (!selectedCourse || !selectedClass) {
            setError('Selecione um curso e uma turma');
            return;
        }

        if (classCapacity && classCapacity.current >= classCapacity.total) {
            setError('Turma está com capacidade máxima');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_URL}/crm/leads/${lead.id}/convert-to-student`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseId: selectedCourse,
                    classId: selectedClass
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao matricular aluno');
            }

            onSuccess(data.student);
            onClose();
        } catch (err) {
            console.error('Enrollment error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getCapacityColor = () => {
        if (!classCapacity) return '#6B7280';
        const percentage = (classCapacity.current / classCapacity.total) * 100;
        if (percentage >= 90) return '#EF4444'; // Red
        if (percentage >= 70) return '#F59E0B'; // Orange
        return '#10B981'; // Green
    };

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title="Matrícula de Aluno"
            width="600px"
            footer={
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: '#F2F2F7',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '99px',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleEnroll}
                        disabled={loading || !selectedCourse || !selectedClass}
                        className="btn-primary"
                        style={{
                            opacity: loading || !selectedCourse || !selectedClass ? 0.5 : 1,
                            cursor: loading || !selectedCourse || !selectedClass ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Matriculando...' : 'Confirmar Matrícula'}
                    </button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Lead Info Summary */}
                <div style={{
                    background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <GraduationCap size={24} />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
                            {lead?.name}
                        </h3>
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.9 }}>
                        <div>📧 {lead?.email || 'Sem e-mail'}</div>
                        <div>📱 {lead?.phone1 || lead?.phone2 || 'Sem telefone'}</div>
                        {lead?.sales_value && (
                            <div style={{ marginTop: '8px', fontWeight: '600' }}>
                                💰 Valor: {Number(lead.sales_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#991B1B'
                    }}>
                        <AlertCircle size={20} />
                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{error}</span>
                    </div>
                )}

                {/* Course Selection */}
                <div>
                    <label style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#8E8E93',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        display: 'block'
                    }}>
                        Curso
                    </label>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="input-field"
                        style={{ width: '100%' }}
                    >
                        <option value="">Selecione um curso...</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>
                                {course.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Class Selection */}
                <div>
                    <label style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: '#8E8E93',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        display: 'block'
                    }}>
                        Turma
                    </label>
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="input-field"
                        style={{ width: '100%' }}
                        disabled={!selectedCourse || classes.length === 0}
                    >
                        <option value="">
                            {!selectedCourse ? 'Selecione um curso primeiro' :
                                classes.length === 0 ? 'Nenhuma turma disponível' :
                                    'Selecione uma turma...'}
                        </option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name} - {cls.days} {cls.startTime}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Class Capacity Indicator */}
                {classCapacity && (
                    <div style={{
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Users size={18} style={{ color: getCapacityColor() }} />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                                Capacidade da Turma
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ flex: 1, background: '#E5E7EB', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(classCapacity.current / classCapacity.total) * 100}%`,
                                    height: '100%',
                                    background: getCapacityColor(),
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: getCapacityColor(), minWidth: '60px' }}>
                                {classCapacity.current}/{classCapacity.total}
                            </span>
                        </div>
                        {classCapacity.current >= classCapacity.total && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444', fontWeight: '600' }}>
                                ⚠️ Turma com capacidade máxima
                            </div>
                        )}
                        {classCapacity.current >= classCapacity.total * 0.9 && classCapacity.current < classCapacity.total && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#F59E0B', fontWeight: '600' }}>
                                ⚠️ Poucas vagas restantes
                            </div>
                        )}
                    </div>
                )}
            </div>
        </VoxModal>
    );
};

export default EnrollmentModal;
