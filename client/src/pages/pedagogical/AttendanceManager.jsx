import React, { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';

const AttendanceManager = () => {
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [students, setStudents] = useState([]);
    const [modules, setModules] = useState([]); // Added
    const [selectedModuleId, setSelectedModuleId] = useState(''); // Added
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState({}); // { studentId: true/false }

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchStudents(selectedClassId);
        }
    }, [selectedClassId]);

    const fetchClasses = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/classes');
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchModules = async (courseId) => {
        try {
            const resCourse = await fetch(`http://localhost:3000/api/courses/${courseId}`);
            if (resCourse.ok) {
                const courseData = await resCourse.json();
                setModules(courseData.Modules || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchStudents = async (classId) => {
        try {
            const res = await fetch(`http://localhost:3000/api/classes/${classId}/students`);
            const data = await res.json();
            setStudents(data);

            const initialAttendance = {};
            data.forEach(s => initialAttendance[s.id] = true);
            setAttendance(initialAttendance);

            // Also fetch modules for the class
            const cls = classes.find(c => c.id === classId);
            if (cls && cls.courseId) fetchModules(cls.courseId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggle = (studentId) => {
        setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
    };

    const handleSave = async () => {
        // Mock save for each student
        const promises = students.map(s => {
            return fetch('http://localhost:3000/api/pedagogical/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: s.id,
                    classId: selectedClassId,
                    date,
                    present: attendance[s.id]
                })
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
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minWidth: '200px' }}
                >
                    <option value="">Selecione a Turma</option>
                    {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
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
                    disabled={!selectedClassId}
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
