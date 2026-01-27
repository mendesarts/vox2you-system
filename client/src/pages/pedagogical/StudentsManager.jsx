import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, UserX, UserCheck, MoreVertical, Filter, Delete, Trash2, FileText, Upload, Download, History, ArrowRightLeft, Building2, FileCog } from 'lucide-react';
import StudentRegistrationWizard from './StudentRegistrationWizard';
import { useAuth } from '../../context/AuthContext';
import { VoxModal } from '../../components/VoxUI';
import Toast from '../../components/Toast';
import TransferModal from './TransferModal';
import UnitTransferModal from './UnitTransferModal';
import StudentLogs from './StudentLogs';
import { formatCPF, formatPhone } from '../../utils/validators';

import StudentImportModal from './StudentImportModal';

// Helper functions for display
const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    return formatPhone(phone);
};

const formatCPFDisplay = (cpf) => {
    if (!cpf) return '';
    return formatCPF(cpf);
};

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
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Selection States
    const [selectedStudent, setSelectedStudent] = useState(null); // Used for modals logic (internal)
    const [selectedStudentId, setSelectedStudentId] = useState(null); // Used for UI Table Selection

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
                if (selectedStudentId === studentToDelete.id) setSelectedStudentId(null);
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

    const handleImportSuccess = (result) => {
        setToast({
            message: `Importação concluída! Sucesso: ${result.success}, Atualizados: ${result.updated}, Falhas: ${result.errors.length}`,
            type: result.errors.length > 0 ? 'warning' : 'success'
        });
        fetchData();
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
            (String(s.id).includes(searchTerm)) || // Search by ID/Matricula
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

    // Helper for Sponte Layout Actions
    // If a row is selected (ID visually selected), we grab the full object from filtered list or full list
    const studentForActions = selectedStudentId ? students.find(s => s.id === selectedStudentId) : null;

    return (
        <div className="manager-container" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* SPONTE LAYOUT CONTAINER */}
            <div className="sponte-layout" style={{ flex: 1, padding: '15px', overflow: 'hidden' }}>
                {/* CENTER: TABLE AREA */}
                <div className="sponte-main">
                    {/* Header Strip */}
                    <div style={{
                        padding: '12px 20px',
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#f8f9fa'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                                <span style={{ color: 'var(--ios-teal)', marginRight: '6px' }}>❚</span>
                                Gestão de Alunos
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: '#777', background: '#e9ecef', padding: '2px 8px', borderRadius: '4px', border: '1px solid #dee2e6' }}>
                                Total: {filteredStudents.length} registros
                            </span>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {loading ? <p style={{ padding: '20px' }}>Carregando...</p> : (
                            <table className="finance-table">
                                <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ width: '40px' }}></th>
                                        <th>Nº Matr.</th>
                                        <th>Nome</th>
                                        <th>CPF</th>
                                        <th>Telefone</th>
                                        <th>Turma</th>
                                        <th>Situação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(student => (
                                        <tr
                                            key={student.id}
                                            onClick={() => setSelectedStudentId(student.id)}
                                            className={selectedStudentId === student.id ? 'selected-row' : ''}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td style={{ textAlign: 'center' }}>
                                                <div style={{
                                                    width: '14px', height: '14px', borderRadius: '50%',
                                                    border: selectedStudentId === student.id ? '4px solid var(--ios-teal)' : '2px solid #ccc',
                                                    margin: '0 auto',
                                                    transition: 'all 0.2s',
                                                    background: selectedStudentId === student.id ? 'white' : 'transparent'
                                                }}></div>
                                            </td>
                                            <td style={{ fontWeight: 700, color: '#555' }}>
                                                {student.id}
                                            </td>
                                            <td style={{ whiteSpace: 'normal', minWidth: '200px' }}>
                                                <div style={{ fontWeight: 600, color: '#333' }}>{student.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{student.email}</div>
                                            </td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatCPFDisplay(student.cpf)}</td>
                                            <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{formatPhoneDisplay(student.mobile || student.phone)}</td>
                                            <td>
                                                {student.Class ? (
                                                    <span style={{ fontSize: '0.8rem', background: '#f8f9fa', padding: '3px 8px', borderRadius: '12px', border: '1px solid #eee', color: '#555' }}>
                                                        {student.Class.name}
                                                    </span>
                                                ) : <span style={{ color: '#ccc' }}>-</span>}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${student.status === 'active' ? 'paid' : 'pending'}`}
                                                    style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px' }}>
                                                    {student.status === 'active' ? 'ATIVO' :
                                                        student.status === 'locked' ? 'TRANCADO' :
                                                            student.status === 'cancelled' ? 'CANCELADO' :
                                                                student.status === 'completed' ? 'FORMADO' : student.status?.toUpperCase()}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredStudents.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                                                Nenhum aluno encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR ACTIONS */}
                <div className="sponte-sidebar">
                    {/* Ações Panel */}
                    <div className="action-panel">
                        <div className="action-header">Ações</div>
                        <div className="action-body">
                            <button className="action-btn primary" onClick={() => { setSelectedStudentId(null); setShowForm(true); }}>
                                + Incluir
                            </button>
                            <button
                                className="action-btn"
                                disabled={!selectedStudentId}
                                onClick={() => {
                                    if (studentForActions) {
                                        setEditingStudent(studentForActions);
                                        setShowForm(true);
                                    }
                                }}
                            >
                                ✎ Editar
                            </button>
                            <button
                                className="action-btn danger"
                                disabled={!selectedStudentId}
                                onClick={() => studentForActions && handleDeleteClick(studentForActions)}
                            >
                                🗑 Excluir
                            </button>
                            <hr style={{ margin: '5px 0', border: 0, borderTop: '1px solid #f1f1f1' }} />
                            <button
                                className="action-btn"
                                disabled={!selectedStudentId}
                                onClick={() => {
                                    if (studentForActions?.mobile) {
                                        window.open(`https://wa.me/55${studentForActions.mobile.replace(/\D/g, '')}`, '_blank');
                                    } else {
                                        alert('Aluno sem número de celular cadastrado.');
                                    }
                                }}
                            >
                                💬 WhatsApp
                            </button>
                            <button
                                className="action-btn"
                                disabled={!selectedStudentId}
                                onClick={() => {
                                    if (studentForActions) {
                                        setEditingStudent(studentForActions);
                                        setShowForm(true);
                                    }
                                }}
                            >
                                🎓 Matricular
                            </button>
                            <button
                                className="action-btn"
                                disabled={!selectedStudentId}
                                onClick={() => {
                                    if (studentForActions) {
                                        // TODO: Implement Financial Modal
                                        alert(`Plano Financeiro: Aluno ${studentForActions.name} (CPF: ${studentForActions.cpf})\n\n[Sistema Preparado para Carregar Financeiro]`);
                                    }
                                }}
                                style={{ borderColor: '#28a745', color: '#28a745' }}
                            >
                                💲 Financeiro
                            </button>
                            <button
                                className="action-btn"
                                disabled={!selectedStudentId}
                                onClick={() => {
                                    if (studentForActions) {
                                        // TODO: Implement Contract Manager
                                        alert('Gerenciador de Contratos (Em Breve)');
                                    }
                                }}
                            >
                                📄 Contratos
                            </button>
                            <button
                                className="action-btn"
                                disabled={!selectedStudentId}
                                onClick={() => studentForActions && handleLogsClick(studentForActions)}
                            >
                                📜 Histórico
                            </button>
                        </div>
                    </div>

                    {/* Filtros Panel */}
                    <div className="action-panel">
                        <div className="action-header">Filtros Rápidos</div>
                        <div className="action-body">
                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>Buscar</label>
                            <input
                                type="text"
                                placeholder="Nome / CPF / Matr..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '8px', fontSize: '0.85rem', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                            />

                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>Situação</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                style={{ padding: '8px', fontSize: '0.85rem', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                            >
                                <option value="all">Todos</option>
                                <option value="active">Ativos</option>
                                <option value="locked">Trancados</option>
                                <option value="cancelled">Cancelados</option>
                                <option value="completed">Formados</option>
                            </select>

                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>Turma</label>
                            <select
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                                style={{ padding: '8px', fontSize: '0.85rem', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                            >
                                <option value="all">Todas as Turmas</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <hr style={{ margin: '15px 0', border: 0, borderTop: '1px solid #f1f1f1' }} />

                            <button onClick={downloadTemplate} style={{ width: '100%', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', color: '#007bff', background: 'none', border: 'none', cursor: 'pointer' }}>
                                <Download size={14} /> Modelo CSV
                            </button>
                            <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary" style={{ width: '100%', fontSize: '0.8rem', justifyContent: 'center', marginTop: '10px' }}>
                                <Upload size={14} /> Importar Alunos
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showForm && (
                <StudentRegistrationWizard
                    initialData={editingStudent}
                    onClose={() => {
                        setShowForm(false);
                        setEditingStudent(null);
                        // Do not clear selection so user can re-edit if wanted, or clear? Better clear editingStudent
                        fetchData();
                    }}
                    onSave={() => {
                        setShowForm(false);
                        setEditingStudent(null);
                        fetchData();
                    }}
                    onViewLogs={() => {
                        setShowForm(false);
                        handleLogsClick(editingStudent);
                    }}
                    onTransfer={() => {
                        setShowForm(false);
                        handleTransferClick(editingStudent);
                    }}
                    onDelete={() => {
                        setShowForm(false);
                        handleDeleteClick(editingStudent);
                    }}
                />
            )}

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

            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                student={selectedStudent} // Modal uses internal selectedStudent
                classes={classes}
                onTransfer={handleTransferSuccess}
            />

            <UnitTransferModal
                isOpen={isUnitTransferModalOpen}
                onClose={() => setIsUnitTransferModalOpen(false)}
                onTransfer={handleUnitTransferSuccess}
            />

            <StudentLogs
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                studentId={selectedStudent?.id}
                studentName={selectedStudent?.name}
            />

            <StudentImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={handleImportSuccess}
            />
        </div>
    );
};

export default StudentsManager;
