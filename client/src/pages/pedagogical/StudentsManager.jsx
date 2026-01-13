import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, UserX, UserCheck, MoreVertical, Filter, Delete, Trash2, FileText, Upload, Download, History, ArrowRightLeft, Building2 } from 'lucide-react';
import StudentRegistrationWizard from './StudentRegistrationWizard';
import { useAuth } from '../../context/AuthContext';
import { VoxModal } from '../../components/VoxUI';
import Toast from '../../components/Toast';
import TransferModal from './TransferModal';
import UnitTransferModal from './UnitTransferModal';
import StudentLogs from './StudentLogs';

const StudentsManager = ({ initialFilters = {}, hideHeader = false }) => {
    const { user, selectedUnit } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [classes, setClasses] = useState([]);
    const [toast, setToast] = useState(null);

    // Delete State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    // Filters State
    const [filterStatus, setFilterStatus] = useState(initialFilters?.status || 'active');
    const [filterCourse, setFilterCourse] = useState('all');
    const [filterClass, setFilterClass] = useState(initialFilters?.classId || 'all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

    // Transfer & Logs State
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isUnitTransferModalOpen, setIsUnitTransferModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        fetchData();
        fetchClasses();
    }, [selectedUnit]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const unitQuery = selectedUnit ? `?unitId=${selectedUnit}` : '';
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students${unitQuery}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleDeleteClick = (student) => {
        setStudentToDelete(student);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students/${studentToDelete.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
                setToast({ message: 'Aluno excluído com sucesso.', type: 'success' });
                setIsDeleteModalOpen(false);
                setStudentToDelete(null);
            } else {
                setToast({ message: 'Erro ao excluir aluno.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        }
    };

    const handleTransferClick = (student) => {
        setSelectedStudent(student);
        setIsTransferModalOpen(true);
    };

    const handleLogsClick = (student) => {
        setSelectedStudent(student);
        setIsLogsModalOpen(true);
    };

    const handleEditClick = (student) => {
        setEditingStudent(student);
        setShowForm(true);
    };

    const handleTransferSuccess = () => {
        setToast({ message: 'Aluno transferido com sucesso!', type: 'success' });
        fetchData();
    };

    const handleUnitTransferSuccess = () => {
        setToast({ message: 'Aluno transferido de unidade com sucesso!', type: 'success' });
        fetchData();
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const csvContent = event.target.result;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/import/csv`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ csvContent })
                });
                const data = await res.json();
                if (res.ok) {
                    setToast({ message: `Importação concluída! Sucesso: ${data.success}, Falhas: ${data.failed}`, type: 'success' });
                    fetchData();
                } else {
                    setToast({ message: 'Erro na importação: ' + data.error, type: 'error' });
                }
            } catch (error) {
                setToast({ message: 'Erro ao enviar arquivo.', type: 'error' });
            }
        };
        reader.readAsText(file);
    };

    const downloadTemplate = () => {
        const headers = 'registrationNumber,name,gender,birthDate,profession,workplace,cpf,cep,address,neighborhood,city,mobile,phone,email,responsibleName,responsiblePhone,status,contractStatus,paymentStatus,classId,courseId,unitId\n';
        const blob = new Blob([headers], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelo_importacao_alunos.csv';
        a.click();
    };

    const canTransferUnit = ['master', 'diretor'].includes(String(user?.role).toLowerCase());

    // Filter Logic
    const filteredStudents = students.filter(s => {
        const matchesSearch = !searchTerm ||
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.cpf && s.cpf.includes(searchTerm)) ||
            (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = filterStatus === 'all' ? true : s.status === filterStatus;
        const matchesCourse = filterCourse === 'all' ? true : String(s.Course?.id) === String(filterCourse);
        const matchesClass = filterClass === 'all' ? true : String(s.Class?.id) === String(filterClass);

        const date = new Date(s.createdAt);
        const matchesMonth = filterMonth === 'all' ? true : date.getMonth() === parseInt(filterMonth);
        const matchesYear = filterYear === 'all' ? true : date.getFullYear() === parseInt(filterYear);

        return matchesSearch && matchesStatus && matchesCourse && matchesClass && matchesMonth && matchesYear;
    });

    const years = [...new Set(students.map(s => new Date(s.createdAt).getFullYear()))].sort((a, b) => b - a);

    return (
        <div className="manager-container">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {!hideHeader && (
                <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'nowrap' }}>
                    <h3 style={{ margin: 0, whiteSpace: 'nowrap' }}>Gestão de Alunos</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                        <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px' }}>
                            <Download size={16} /> Modelo CSV
                        </button>
                        <div style={{ position: 'relative' }}>
                            <input type="file" accept=".csv" onChange={handleImport} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                            <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px' }}>
                                <Upload size={16} /> Importar
                            </button>
                        </div>
                        {canTransferUnit && (
                            <button className="btn-secondary" onClick={() => setIsUnitTransferModalOpen(true)} style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px', color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                                <Building2 size={16} /> Transf. Unidade
                            </button>
                        )}
                        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                            <Plus size={16} /> Novo Aluno
                        </button>
                    </div>
                </div>
            )}

            {hideHeader && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '8px', flexWrap: 'nowrap' }}>
                    <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px' }}>
                        <Download size={16} /> Modelo CSV
                    </button>
                    <div style={{ position: 'relative' }}>
                        <input type="file" accept=".csv" onChange={handleImport} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                        <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px' }}>
                            <Upload size={16} /> Importar
                        </button>
                    </div>
                    {canTransferUnit && (
                        <button className="btn-secondary" onClick={() => setIsUnitTransferModalOpen(true)} style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', height: '38px', color: '#8b5cf6', borderColor: '#8b5cf6' }}>
                            <Building2 size={16} /> Transf. Unidade
                        </button>
                    )}
                    <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}>
                        <Plus size={16} /> Novo Aluno
                    </button>
                </div>
            )}

            {/* Filters Bar */}
            <div className="filter-bar" style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <Filter size={18} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filtros:</span>
                </div>

                <div className="filter-group">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="locked">Trancados</option>
                        <option value="cancelled">Cancelados</option>
                        <option value="completed">Formados</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filterCourse}
                        onChange={(e) => { setFilterCourse(e.target.value); setFilterClass('all'); }}
                        className="filter-select"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="all">Todos os Cursos</option>
                        {Array.from(new Set(classes.map(c => c.Course?.id))).map(cid => {
                            const course = classes.find(c => c.Course?.id === cid)?.Course;
                            return course ? <option key={cid} value={cid}>{course.name}</option> : null;
                        })}
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="filter-select"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="all">Todas as Turmas</option>
                        {classes
                            .filter(c => filterCourse === 'all' || String(c.Course?.id) === String(filterCourse))
                            .map(c => (
                                <option key={c.id} value={c.id}>{c.Course?.name} - {c.classNumber || '-'} - {c.name}</option>
                            ))}
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="filter-select"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="all">Todos os Meses</option>
                        <option value="0">Janeiro</option>
                        <option value="1">Fevereiro</option>
                        <option value="2">Março</option>
                        <option value="3">Abril</option>
                        <option value="4">Maio</option>
                        <option value="5">Junho</option>
                        <option value="6">Julho</option>
                        <option value="7">Agosto</option>
                        <option value="8">Setembro</option>
                        <option value="9">Outubro</option>
                        <option value="10">Novembro</option>
                        <option value="11">Dezembro</option>
                    </select>
                </div>

                <div className="filter-group">
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="filter-select"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="all">Todos os Anos</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '8px 8px 8px 36px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="finance-table-container" style={{ marginTop: 0 }}>
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Turma</th>
                                <th>Data Matrícula</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{student.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.email || student.mobile}</div>
                                        </div>
                                    </td>
                                    <td>
                                        {student.Class ? (
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <span style={{ fontWeight: 600 }}>{student.Class.Course?.name}</span>
                                                <span style={{ margin: '0 4px', color: 'var(--text-muted)' }}>•</span>
                                                <span>{student.Class.name}</span>
                                            </div>
                                        ) : <span style={{ color: 'var(--text-muted)' }}>Sem turma</span>}
                                    </td>
                                    <td>
                                        {new Date(student.createdAt).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${student.status === 'active' ? 'paid' :
                                            student.status === 'locked' ? 'pending' :
                                                student.status === 'completed' ? 'paid' :
                                                    'overdue'
                                            }`}>
                                            {
                                                student.status === 'active' ? 'Ativo' :
                                                    student.status === 'locked' ? 'Trancado' :
                                                        student.status === 'cancelled' ? 'Cancelado' :
                                                            student.status === 'completed' ? 'Formado' : student.status
                                            }
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => handleLogsClick(student)}
                                                style={{
                                                    background: 'rgba(94, 92, 230, 0.1)',
                                                    color: '#5E5CE6',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyItems: 'center'
                                                }}
                                                title="Histórico/Logs"
                                            >
                                                <History size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleTransferClick(student)}
                                                style={{
                                                    background: 'rgba(175, 82, 222, 0.1)',
                                                    color: '#AF52DE',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyItems: 'center'
                                                }}
                                                title="Transferir Turma"
                                            >
                                                <ArrowRightLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEditClick(student)}
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
                                                onClick={() => handleDeleteClick(student)}
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
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                                        Nenhum aluno encontrado com os filtros selecionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showForm && (
                <StudentRegistrationWizard
                    initialData={editingStudent}
                    onClose={() => {
                        setShowForm(false);
                        setEditingStudent(null);
                    }}
                    onSave={() => {
                        setShowForm(false);
                        setEditingStudent(null);
                        fetchData();
                    }}
                    classes={classes}
                />
            )}

            {/* DELETE MODAL */}
            <VoxModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Excluir Aluno"
                width="400px"
            >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                        <Trash2 color="#FF3B30" size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>Excluir Aluno?</h3>
                    <p style={{ color: '#8E8E93', marginBottom: '24px', fontSize: '14px', lineHeight: '1.5' }}>
                        Você está prestes a excluir o aluno <strong>{studentToDelete?.name}</strong>.
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

            {/* TRANSFER MODAL */}
            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                student={selectedStudent}
                classes={classes}
                onTransfer={handleTransferSuccess}
            />

            {/* UNIT TRANSFER MODAL */}
            <UnitTransferModal
                isOpen={isUnitTransferModalOpen}
                onClose={() => setIsUnitTransferModalOpen(false)}
                onTransfer={handleUnitTransferSuccess}
            />

            {/* LOGS MODAL */}
            <StudentLogs
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                studentId={selectedStudent?.id}
                studentName={selectedStudent?.name}
            />
        </div>
    );
};

export default StudentsManager;
