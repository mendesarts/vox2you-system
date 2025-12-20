import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, ChevronDown, ChevronUp, Users, Clock, Edit2, Save, X, Video } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import Toast from '../components/Toast';
import PageHeader from '../components/PageHeader';
import DataCard from '../components/DataCard';
import ActionModal from '../components/ActionModal';

const CoursesSettings = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // New Course State
    const [newCourse, setNewCourse] = useState({ name: '', workload: 40, weeklyFrequency: 2, mentorshipsIncluded: 0, modules: [] });

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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses`);
            const data = await res.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCourse)
            });
            if (res.ok) {
                fetchCourses();
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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${confirmModal.courseId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchCourses();
                showToast('Curso excluído com sucesso!');
            } else {
                showToast('Erro ao excluir curso.', 'error');
            }
        } catch (error) {
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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${editingCourseId}`, {
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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/modules/${editingModuleId}`, {
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
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${courseId}/modules`, {
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
        setExpandedCourse(expandedCourse === id ? null : id);
    };

    const handleLaunchProgram = (courseId) => {
        showToast('Programa de aulas lançado (simulado)', 'success');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 pb-32">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleDeleteCourse}
                title="Excluir Curso"
                message="Tem certeza que deseja excluir este curso? Esta ação remove todo o histórico."
                isDangerous={true}
            />

            <PageHeader
                title="Gestão de Cursos"
                subtitle="Configure os cursos, módulos e carga horária."
                actionLabel="Novo Curso"
                actionIcon={Plus}
                onAction={() => setIsCreating(true)}
            />

            {/* CREATE MODAL */}
            <ActionModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                title="Novo Curso"
                footer={
                    <>
                        <button onClick={() => setIsCreating(false)} className="btn-secondary">Cancelar</button>
                        <button onClick={handleCreateCourse} className="btn-primary">Salvar Curso</button>
                    </>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Curso</label>
                        <input required value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                            placeholder="Ex: Oratória Premium" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Carga Horária (h)</label>
                        <input type="number" required value={newCourse.workload} onChange={e => setNewCourse({ ...newCourse, workload: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Freq. Semanal</label>
                        <input type="number" required value={newCourse.weeklyFrequency} onChange={e => setNewCourse({ ...newCourse, weeklyFrequency: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mentorias Incluídas</label>
                        <input type="number" value={newCourse.mentorshipsIncluded} onChange={e => setNewCourse({ ...newCourse, mentorshipsIncluded: parseInt(e.target.value || 0) })} />
                    </div>
                </div>
            </ActionModal>

            {/* LIST */}
            {loading ? <div className="text-center p-10 animate-pulse text-teal-600 font-bold">Carregando cursos...</div> : (
                <div className="grid grid-cols-1 gap-6">
                    {courses.map(course => (
                        <DataCard
                            key={course.id}
                            title={editingCourseId === course.id ? "Editando..." : course.name}
                            subtitle={`${course.Modules?.length || 0} módulos cadastrados`}
                            status={course.Modules?.length > 0 ? "active" : "pending"}
                            statusColor={course.Modules?.length > 0 ? "border-teal-500" : "border-amber-400"}
                            onClick={() => toggleExpand(course.id)}
                            actions={
                                <div className="flex gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); startEditingCourse(course); }} className="p-2 hover:bg-gray-100 rounded-lg text-indigo-600">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); confirmDeleteCourse(course.id); }} className="p-2 hover:bg-gray-100 rounded-lg text-rose-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            }
                        >
                            {/* EDITOR MODE */}
                            {editingCourseId === course.id ? (
                                <div onClick={e => e.stopPropagation()} className="grid grid-cols-3 gap-4 mb-4">
                                    <input value={editCourseData.name} onChange={e => setEditCourseData({ ...editCourseData, name: e.target.value })} placeholder="Nome" />
                                    <input value={editCourseData.workload} onChange={e => setEditCourseData({ ...editCourseData, workload: e.target.value })} type="number" placeholder="Horas" />
                                    <div className="flex gap-2">
                                        <button onClick={saveCourseEdit} className="btn-primary w-full"><Save size={16} /> Salvar</button>
                                        <button onClick={cancelEditCourse} className="btn-secondary w-full"><X size={16} /> Cancelar</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-6 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><Clock size={14} /> {course.workload}h Total</span>
                                    <span className="flex items-center gap-1"><CalendarCheck size={14} /> {course.weeklyFrequency}x/sem</span>
                                    <span className="flex items-center gap-1"><Users size={14} /> {course.mentorshipsIncluded} Mentorias</span>
                                </div>
                            )}

                            {/* EXPANDED CONTENT (MODULES) */}
                            {expandedCourse === course.id && (
                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 animate-in slide-in-from-top-2 duration-300 cursor-default" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2"><Book size={18} /> Programa de Aulas</h4>
                                        <button onClick={() => handleLaunchProgram(course.id)} className="text-xs uppercase font-bold text-teal-600 hover:text-teal-700 border border-teal-200 px-3 py-1 rounded-full">
                                            Lançar Programa
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {course.Modules?.sort((a, b) => a.order - b.order).map(mod => (
                                            <div key={mod.id} className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg flex items-center gap-4 hover:bg-gray-100 transition-colors group">
                                                {editingModuleId === mod.id ? (
                                                    <div className="flex gap-2 w-full">
                                                        <input className="w-16" type="number" value={editModuleData.order} onChange={e => setEditModuleData({ ...editModuleData, order: e.target.value })} />
                                                        <input className="flex-1" value={editModuleData.title} onChange={e => setEditModuleData({ ...editModuleData, title: e.target.value })} />
                                                        <button onClick={saveModuleEdit} className="text-teal-600"><Save size={18} /></button>
                                                        <button onClick={cancelEditModule} className="text-gray-400"><X size={18} /></button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="font-bold text-teal-600 w-8">#{mod.order}</span>
                                                        <div className="flex-1">
                                                            <div className="font-medium text-gray-800">{mod.title}</div>
                                                            {mod.description && <div className="text-xs text-gray-500">{mod.description}</div>}
                                                        </div>
                                                        <button onClick={() => startEditingModule(mod)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-all">
                                                            <Edit2 size={16} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* ADD MODULE */}
                                    <form onSubmit={(e) => handleAddModule(e, course.id)} className="mt-4 bg-teal-50/50 p-4 rounded-xl border border-teal-100 flex gap-4 items-end">
                                        <div className="w-20">
                                            <label className="text-[10px] uppercase font-bold text-teal-800">Ordem</label>
                                            <input type="number" required value={newModule.order} onChange={e => setNewModule({ ...newModule, order: e.target.value })} className="bg-white border-teal-200" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] uppercase font-bold text-teal-800">Título</label>
                                            <input required value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })} className="bg-white border-teal-200" placeholder="Novo tópico..." />
                                        </div>
                                        <button type="submit" className="btn-primary h-[42px] aspect-square flex items-center justify-center p-0 rounded-lg">
                                            <Plus size={20} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </DataCard>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CoursesSettings;
