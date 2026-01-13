import React, { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AttendanceManager = () => {
    const location = useLocation();
    const [classes, setClasses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState(location.state?.classId || '');
    const [students, setStudents] = useState([]);
    const [modules, setModules] = useState([]); // Added
    const [selectedModuleId, setSelectedModuleId] = useState(location.state?.moduleId || ''); // Added
    const [date, setDate] = useState(location.state?.date || new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({}); // { studentId: true/false }

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (location.state?.classId) {
            setSelectedClassId(location.state.classId);
        }
        if (location.state?.date) {
            setDate(location.state.date);
        }
        if (location.state?.moduleId) {
            setSelectedModuleId(location.state.moduleId);
        }
    }, [location]);

    useEffect(() => {
        if (selectedClassId) {
            fetchStudents(selectedClassId);
            // Fetch modules independently to be more robust
            fetchClassModules(selectedClassId);
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchClassModules = async (classId) => {
        try {
            const token = localStorage.getItem('token');
            // First get class details to find courseId
            const resCls = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes/${classId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (resCls.ok) {
                const classData = await resCls.json();
                if (classData && classData.courseId) {
                    const resCourse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${classData.courseId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resCourse.ok) {
                        const courseData = await resCourse.json();
                        setModules(courseData.Modules || []);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStudents = async (classId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes/${classId}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStudents(data);

            const initialAttendance = {};
            data.forEach(s => initialAttendance[s.id] = true);
            setAttendance(initialAttendance);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = (studentId) => {
        setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    const handleSave = async () => {
        const token = localStorage.getItem('token');
        const promises = students.map(s => {
            const payload = {
                studentId: s.id,
                classId: selectedClassId,
                date,
                present: attendance[s.id]
            };
            if (selectedModuleId) {
                payload.moduleId = selectedModuleId;
                const mod = modules.find(m => String(m.id) === String(selectedModuleId));
                if (mod) payload.moduleTitle = mod.title;
            }
            return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/attendance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
        });

        await Promise.all(promises);
        alert('Chamada realizada com sucesso!');
    };

    return (
        <div className="control-card">
            <h3>Registro de Frequência</h3>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                    value={selectedCourseId}
                    onChange={e => { setSelectedCourseId(e.target.value); setSelectedClassId(''); }}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minWidth: '200px' }}
                >
                    <option value="">Selecione o Curso</option>
                    {Array.from(new Set(classes.map(c => c.Course?.id))).map(cid => {
                        const course = classes.find(c => c.Course?.id === cid)?.Course;
                        return course ? <option key={cid} value={cid}>{course.name}</option> : null;
                    })}
                </select>

                <select
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minWidth: '200px' }}
                    disabled={!selectedCourseId}
                >
                    <option value="">{selectedCourseId ? 'Selecione a Turma' : 'Selecione um curso primeiro'}</option>
                    {classes
                        .filter(c => !selectedCourseId || String(c.Course?.id) === String(selectedCourseId))
                        .map(c => (
                            <option key={c.id} value={c.id}>{c.Course?.name} - {c.classNumber || '-'} - {c.name}</option>
                        ))}
                </select>

                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                />

                <select
                    value={selectedModuleId}
                    onChange={e => setSelectedModuleId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minWidth: '200px' }}
                >
                    <option value="">Selecione a Aula (Opcional)</option>
                    {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.order}. {m.title}</option>
                    ))}
                </select>
            </div>

            {selectedClassId && (
                <>
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Aluno</th>
                                <th style={{ textAlign: 'center' }}>Presença</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => (
                                <tr key={student.id}>
                                    <td>{student.name}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => setAttendance(prev => ({ ...prev, [student.id]: false }))}
                                                style={{
                                                    background: !attendance[student.id] ? '#ef4444' : 'transparent',
                                                    color: !attendance[student.id] ? '#fff' : '#ef4444',
                                                    border: '1px solid #ef4444',
                                                    borderRadius: '4px',
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <X size={16} /> Falta
                                            </button>
                                            <button
                                                onClick={() => setAttendance(prev => ({ ...prev, [student.id]: true }))}
                                                style={{
                                                    background: attendance[student.id] ? '#10b981' : 'transparent',
                                                    color: attendance[student.id] ? '#fff' : '#10b981',
                                                    border: '1px solid #10b981',
                                                    borderRadius: '4px',
                                                    padding: '6px 12px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    fontWeight: 600
                                                }}
                                            >
                                                <Check size={16} /> Presença
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button className="btn-primary" onClick={handleSave}>Salvar Chamada</button>
                    </div>
                </>
            )}
        </div>
    );
};

export default AttendanceManager;
