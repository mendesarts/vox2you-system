import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, ChevronDown, ChevronUp, Users, Clock, Edit2, Save, X } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';

const CoursesSettings = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // New Course State
    const [newCourse, setNewCourse] = useState({ name: '', workload: 40, weeklyFrequency: 2, mentorshipsIncluded: 0, modules: [] });
    // Placeholder for launching program (future implementation)
    const handleLaunchProgram = (courseId) => {
        // TODO: Implement program launch logic, e.g., POST to /courses/:id/launch
        console.log('Launching program for course', courseId);
        showToast('Programa de aulas lançado (simulado)', 'success');
    };

    // New Module State
    const [newModule, setNewModule] = useState({ title: '', description: '', order: 1 });

    // Edit States
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [editCourseData, setEditCourseData] = useState({});

    const [editingModuleId, setEditingModuleId] = useState(null);
    const [editModuleData, setEditModuleData] = useState({});

    // UI States
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, courseId: null });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const showToast = (message, type = 'success') => setToast({ message, type });

    const fetchCourses = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/courses');
            const data = await res.json();
            setCourses(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/courses', {
                // Ensure proper headers for JSON payload
                // (already set) but adding explicit mode for CORS safety
                mode: 'cors',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCourse)
            });
            if (res.ok) {
                fetchCourses();
                setIsCreating(false);
                setIsCreating(false);
                setNewCourse({ name: '', workload: 40, weeklyFrequency: 2, mentorshipsIncluded: 0, modules: [] });
                showToast('Curso criado com sucesso!');
            }
        } catch (error) {
            showToast('Erro ao criar curso', 'error');
        }
    };

    const confirmDeleteCourse = (courseId) => {
        setConfirmModal({ isOpen: true, courseId });
    };

    const handleDeleteCourse = async () => {
        if (!confirmModal.courseId) return;

        try {
            const res = await fetch(`http://localhost:3000/api/courses/${confirmModal.courseId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCourses();
                showToast('Curso excluído com sucesso!');
            } else {
                showToast('Erro ao excluir curso.', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir curso:', error);
            showToast('Erro ao excluir curso.', 'error');
        }
    };

    // Edit Course Handlers
    const startEditingCourse = (course) => {
        setEditingCourseId(course.id);
        setEditCourseData({ ...course });
    };

    const cancelEditCourse = () => {
        setEditingCourseId(null);
        setEditCourseData({});
    };

    const saveCourseEdit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3000/api/courses/${editingCourseId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editCourseData)
            });
            if (res.ok) {
                fetchCourses();
                setEditingCourseId(null);
                showToast('Curso atualizado com sucesso!');
            } else {
                showToast('Erro ao atualizar curso', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar curso', 'error');
        }
    };

    // Edit Module Handlers
    const startEditingModule = (module) => {
        setEditingModuleId(module.id);
        setEditModuleData({ ...module });
    };

    const cancelEditModule = () => {
        setEditingModuleId(null);
        setEditModuleData({});
    };

    const saveModuleEdit = async () => {
        try {
            const res = await fetch(`http://localhost:3000/api/courses/modules/${editingModuleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editModuleData)
            });
            if (res.ok) {
                fetchCourses();
                setEditingModuleId(null);
                showToast('Aula atualizada com sucesso!');
            } else {
                showToast('Erro ao atualizar aula', 'error');
            }
        } catch (error) {
            showToast('Erro ao atualizar aula', 'error');
        }
    };

    const handleAddModule = async (e, courseId) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3000/api/courses/${courseId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newModule)
            });
            if (res.ok) {
                fetchCourses();
                setNewModule({ title: '', description: '', order: newModule.order + 1 });
            }
        } catch (error) {
            showToast('Erro ao adicionar módulo', 'error');
        }
    };

    const toggleExpand = (id) => {
        if (expandedCourse === id) setExpandedCourse(null);
        else setExpandedCourse(id);
    };

    return (
        <div style={{ paddingBottom: '80px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleDeleteCourse}
                title="Excluir Curso"
                message="Tem certeza que deseja excluir este curso? Esta ação também removerá todo o programa de aulas associado e não poderá ser desfeita."
                isDangerous={true}
            />
            <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Book size={24} style={{ marginRight: '10px' }} /> Gestão de Cursos e Programas
                </div>
                <button className="btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={16} /> Novo Curso
                </button>
            </div>

            {isCreating && (
                <div className="control-card" style={{ marginBottom: '20px', border: '1px solid var(--primary)' }}>
                    <h4>Novo Curso</h4>
                    <form onSubmit={handleCreateCourse} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <input placeholder="Nome do Curso" required value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} className="input-field" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nome completo do curso</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Clock size={16} color="var(--text-muted)" />
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Carga Horária (h)" required value={newCourse.workload} onChange={e => setNewCourse({ ...newCourse, workload: e.target.value })} className="input-field" style={{ width: '100%' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carga horária total (horas)</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Clock size={16} color="var(--text-muted)" />
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Freq. Semanal" required value={newCourse.weeklyFrequency} onChange={e => setNewCourse({ ...newCourse, weeklyFrequency: e.target.value })} className="input-field" style={{ width: '100%' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aulas por semana</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={16} color="var(--text-muted)" />
                            <div style={{ flex: 1 }}>
                                <input type="number" placeholder="Qtd. Mentorias" required value={newCourse.mentorshipsIncluded} onChange={e => setNewCourse({ ...newCourse, mentorshipsIncluded: parseInt(e.target.value || 0) })} className="input-field" style={{ width: '100%' }} />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mentorias por contrato</span>
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary">Cancelar</button>
                            <button type="submit" className="btn-primary">Salvar Curso</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="courses-list">
                {courses.map(course => (
                    <div key={course.id} className="control-card" style={{ marginBottom: '15px' }}>
                        <div
                            className="course-header"
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => toggleExpand(course.id)}
                        >
                            {editingCourseId === course.id ? (
                                <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                    <input
                                        value={editCourseData.name}
                                        onChange={e => setEditCourseData({ ...editCourseData, name: e.target.value })}
                                        className="input-field"
                                        style={{ flex: 1 }}
                                        placeholder="Nome do curso"
                                    />
                                    <input
                                        type="number"
                                        value={editCourseData.workload}
                                        onChange={e => setEditCourseData({ ...editCourseData, workload: e.target.value })}
                                        className="input-field"
                                        style={{ width: '80px' }}
                                        placeholder="Horas"
                                    />
                                    <input
                                        type="number"
                                        value={editCourseData.weeklyFrequency}
                                        onChange={e => setEditCourseData({ ...editCourseData, weeklyFrequency: e.target.value })}
                                        className="input-field"
                                        style={{ width: '80px' }}
                                        placeholder="Freq."
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={saveCourseEdit} className="btn-primary" style={{ padding: '8px' }} title="Salvar"><Save size={16} /></button>
                                        <button onClick={cancelEditCourse} className="btn-secondary" style={{ padding: '8px' }} title="Cancelar"><X size={16} /></button>
                                    </div>
                                    <div onClick={(e) => { e.stopPropagation(); toggleExpand(course.id); }} style={{ cursor: 'pointer', padding: '4px' }}>
                                        {expandedCourse === course.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>{course.name}</h3>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '15px', marginTop: '5px' }}>
                                            <span>{course.workload}h</span>
                                            <span>{course.weeklyFrequency}x/sem</span>
                                            <span>{course.mentorshipsIncluded || 0} mentorias</span>
                                            <span>{course.Modules?.length || 0} aulas</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {expandedCourse === course.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        <button onClick={(e) => { e.stopPropagation(); startEditingCourse(course); }} className="btn-secondary" style={{ padding: '8px' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); confirmDeleteCourse(course.id); }} className="btn-danger" style={{ marginLeft: '5px' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {expandedCourse === course.id && (
                            <div className="course-program" style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <h4 style={{ marginBottom: '15px', color: 'var(--text-main)' }}>Programa de Aulas</h4>
                                {/* Button to launch the program of classes */}
                                <button onClick={() => handleLaunchProgram(course.id)} className="btn-primary" style={{ marginBottom: '10px' }}>
                                    Lançar Programa
                                </button>

                                <div className="modules-list" style={{ marginBottom: '20px' }}>
                                    {course.Modules && course.Modules.length > 0 ? (
                                        course.Modules.map(mod => (
                                            <div key={mod.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                padding: '10px', background: 'var(--bg-app)', marginBottom: '8px', borderRadius: '6px'
                                            }}>
                                                {editingModuleId === mod.id ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, width: '100%' }}>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <input
                                                                value={editModuleData.order}
                                                                onChange={e => setEditModuleData({ ...editModuleData, order: parseInt(e.target.value) })}
                                                                className="input-field" style={{ width: '50px', padding: '6px' }}
                                                                placeholder="Ord."
                                                            />
                                                            <input
                                                                value={editModuleData.title}
                                                                onChange={e => setEditModuleData({ ...editModuleData, title: e.target.value })}
                                                                className="input-field" style={{ flex: 1, padding: '6px' }}
                                                                placeholder="Título da Aula"
                                                            />
                                                            <button onClick={saveModuleEdit} className="btn-primary" style={{ padding: '6px' }}><Save size={14} /></button>
                                                            <button onClick={cancelEditModule} className="btn-secondary" style={{ padding: '6px' }}><X size={14} /></button>
                                                        </div>
                                                        <input
                                                            value={editModuleData.description}
                                                            onChange={e => setEditModuleData({ ...editModuleData, description: e.target.value })}
                                                            className="input-field" style={{ width: '100%', padding: '6px' }}
                                                            placeholder="Descrição do conteúdo"
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--primary)', width: '30px' }}>#{mod.order}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 500 }}>{mod.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{mod.description}</div>
                                                        </div>
                                                        <button onClick={() => startEditingModule(mod)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', marginRight: '5px' }}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Nenhuma aula cadastrada.</p>
                                    )}
                                </div>

                                <form onSubmit={(e) => handleAddModule(e, course.id)} style={{ background: 'var(--bg-surface-hover)', padding: '20px', borderRadius: '8px', marginBottom: '10px' }}>
                                    <h5 style={{ marginBottom: '10px' }}>Adicionar Aula</h5>
                                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '10px', alignItems: 'start' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <input
                                                type="number"
                                                placeholder="Ord."
                                                value={newModule.order}
                                                onChange={e => setNewModule({ ...newModule, order: parseInt(e.target.value) })}
                                                className="input-field"
                                                style={{ padding: '8px' }}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Ordem</span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <input
                                                placeholder="Título da Aula"
                                                required
                                                value={newModule.title}
                                                onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                                className="input-field"
                                                style={{ padding: '8px' }}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Título do tema</span>
                                        </div>
                                        <button type="submit" className="btn-primary" style={{ padding: '8px' }}>
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                    <div style={{ marginTop: '10px' }}>
                                        <input
                                            placeholder="Descrição do conteúdo..."
                                            value={newModule.description}
                                            onChange={e => setNewModule({ ...newModule, description: e.target.value })}
                                            className="input-field"
                                            style={{ width: '100%', padding: '8px' }}
                                        />
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Descrição</span>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                ))
                }
            </div >

            <style>{`
                .input-field {
                    background: var(--bg-app);
                    border: 1px solid var(--border);
                    color: var(--text-main);
                    border-radius: 4px;
                    padding: 10px;
                }
            `}</style>
        </div >
    );
};

export default CoursesSettings;
