import React, { useState, useEffect } from 'react';
import { Book, Plus, Trash2, Users, Clock, Edit2, Save, X, Video, CalendarCheck, Search, Eye, ChevronRight } from 'lucide-react';
import { VoxModal } from '../components/VoxUI';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

const CoursesSettings = () => {
    const { user } = useAuth();
    const canManageCourses = user && [1, 10].includes(Number(user.roleId));

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState(null);

    // Edit states
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [editCourseData, setEditCourseData] = useState({});
    const [editingModuleId, setEditingModuleId] = useState(null);
    const [editModuleData, setEditModuleData] = useState({});

    // New item states
    const [newCourse, setNewCourse] = useState({ name: '', workload: 40, weeklyFrequency: 2, mentorshipsIncluded: 0 });
    const [newModule, setNewModule] = useState({ title: '', description: '', order: 1 });

    useEffect(() => { fetchCourses(); }, []);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setCourses(Array.isArray(data) ? data : []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newCourse)
            });
            if (res.ok) {
                fetchCourses();
                setIsCreating(false);
                setNewCourse({ name: '', workload: 40, weeklyFrequency: 2, mentorshipsIncluded: 0 });
                setToast({ message: 'Curso criado com sucesso!', type: 'success' });
            }
        } catch (error) { console.error(error); }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Excluir este curso e todos os seus módulos?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                fetchCourses();
                setToast({ message: 'Curso excluído.', type: 'success' });
            }
        } catch (error) { console.error(error); }
    };

    const handleAddModule = async (e, courseId) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${courseId}/modules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newModule)
            });
            if (res.ok) {
                fetchCourses();
                setNewModule({ title: '', description: '', order: newModule.order + 1 });
            }
        } catch (error) { console.error(error); }
    };

    const filteredCourses = courses.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '32px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header Master */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', margin: 0 }}>Grade de <span style={{ color: '#32D74B' }}>Cursos</span></h1>
                    <p style={{ opacity: 0.5, fontSize: '14px', marginTop: '4px' }}>Gestão de currículo, carga horária e módulos</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ background: '#F2F2F7', padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}>
                        <Search size={16} color="#8E8E93" />
                        <input
                            placeholder="Buscar curso..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '14px', outline: 'none', color: '#1C1C1E', width: '150px' }}
                        />
                    </div>
                    {canManageCourses && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn-primary"
                            style={{ height: '40px', padding: '0 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                        >
                            <Plus size={18} /> Novo Curso
                        </button>
                    )}
                </div>
            </header>

            {/* Grid de Cursos iOS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '100px', opacity: 0.5, gridColumn: '1/-1', color: '#8E8E93' }}>Sincronizando currículo...</div>
                ) : filteredCourses.map(course => (
                    <div key={course.id} className="vox-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', borderRadius: '16px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', color: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Book size={24} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {canManageCourses && (
                                    <button
                                        onClick={() => handleDeleteCourse(course.id)}
                                        style={{ border: 'none', background: '#FFEFED', color: '#FF3B30', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
                                        title="Excluir curso"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#1C1C1E' }}>{course.name}</h3>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.5px' }}>{course.Modules?.length || 0} MÓDULOS CADASTRADOS</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ background: '#F9F9F9', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5EA' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>CARGA HORÁRIA</div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1C1C1E' }}>{course.workload}h</div>
                            </div>
                            <div style={{ background: '#F9F9F9', padding: '12px', borderRadius: '12px', border: '1px solid #E5E5EA' }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', color: '#8E8E93', marginBottom: '4px' }}>FREQUÊNCIA</div>
                                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1C1C1E' }}>{course.weeklyFrequency}x/sem</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setExpandedCourse(course.id)}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #32D74B',
                                background: 'rgba(50, 215, 75, 0.05)', color: '#32D74B', fontWeight: '700', cursor: 'pointer',
                                transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px'
                            }}
                        >
                            Ver Grades de Aulas <ChevronRight size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Modals */}
            {isCreating && (
                <VoxModal isOpen={true} onClose={() => setIsCreating(false)} title="Novo Curso" theme="ios">
                    <form onSubmit={handleCreateCourse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label className="label-field">Nome do Curso</label>
                            <input className="input-field" placeholder="Ex: Inglês Instrumental" required value={newCourse.name} onChange={e => setNewCourse({ ...newCourse, name: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label className="label-field">Carga Horária (h)</label>
                                <input type="number" className="input-field" placeholder="40" value={newCourse.workload} onChange={e => setNewCourse({ ...newCourse, workload: e.target.value })} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label className="label-field">Aulas Semanais</label>
                                <input type="number" className="input-field" placeholder="2" value={newCourse.weeklyFrequency} onChange={e => setNewCourse({ ...newCourse, weeklyFrequency: e.target.value })} style={{ width: '100%' }} />
                            </div>
                        </div>
                        <div>
                            <label className="label-field">Mentorias Incluídas</label>
                            <input type="number" className="input-field" placeholder="0" value={newCourse.mentorshipsIncluded} onChange={e => setNewCourse({ ...newCourse, mentorshipsIncluded: e.target.value })} style={{ width: '100%' }} />
                        </div>
                        <button type="submit" className="btn-primary" style={{ height: '44px', marginTop: '8px' }}>Criar Curso</button>
                    </form>
                </VoxModal>
            )}

            {expandedCourse && (
                <VoxModal
                    isOpen={true}
                    onClose={() => setExpandedCourse(null)}
                    title={courses.find(c => c.id === expandedCourse)?.name}
                    width="600px"
                    theme="ios"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                            {courses.find(c => c.id === expandedCourse)?.Modules?.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', color: '#8E8E93', fontSize: '14px' }}>Nenhum módulo cadastrado</div>
                            ) : (
                                courses.find(c => c.id === expandedCourse)?.Modules?.sort((a, b) => a.order - b.order).map((mod, i) => (
                                    <div key={mod.id} style={{ padding: '16px', background: '#F9F9F9', borderRadius: '12px', border: '1px solid #E5E5EA', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1C1C1E', color: '#fff', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ fontWeight: '600', color: '#1C1C1E', fontSize: '14px' }}>{mod.title}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        {canManageCourses && (
                            <form
                                onSubmit={e => handleAddModule(e, expandedCourse)}
                                style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid #E5E5EA' }}
                            >
                                <input
                                    className="input-field" placeholder="Nome do novo módulo..." required
                                    style={{ flex: 1 }}
                                    value={newModule.title} onChange={e => setNewModule({ ...newModule, title: e.target.value })}
                                />
                                <button type="submit" className="btn-primary" style={{ height: '44px', whiteSpace: 'nowrap' }}>+ Módulo</button>
                            </form>
                        )}
                    </div>
                </VoxModal>
            )}

        </div>
    );
};

export default CoursesSettings;
