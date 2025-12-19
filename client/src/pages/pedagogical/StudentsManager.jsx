import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, UserX, UserCheck, MoreVertical, Filter, Delete, Trash2, FileText, Upload, Download } from 'lucide-react';
import StudentRegistrationWizard from './StudentRegistrationWizard';
import { useAuth } from '../../context/AuthContext';

const StudentsManager = ({ initialFilters }) => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [classes, setClasses] = useState([]);

    // Filters State
    const [filterStatus, setFilterStatus] = useState(initialFilters?.status || 'all');
    const [filterClass, setFilterClass] = useState('all');
    const [filterMonth, setFilterMonth] = useState('all');
    const [filterYear, setFilterYear] = useState('all');

    useEffect(() => {
        if (initialFilters) {
            if (initialFilters.status) setFilterStatus(initialFilters.status);
            if (initialFilters.classId) setFilterClass(initialFilters.classId);
        }
    }, [initialFilters]);

    useEffect(() => {
        fetchData();
        fetchClasses();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/students');
            const data = await res.json();
            setStudents(data);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/classes');
            const data = await res.json();
            setClasses(data);
        } catch (error) {
            console.error('Erro ao buscar turmas:', error);
        }
    };

    // Filter Logic
    const filteredStudents = students.filter(s => {
        // Search
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cpf?.includes(searchTerm) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase());

        // Status
        const matchesStatus = filterStatus === 'all' ? true : s.status === filterStatus;

        // Class
        const matchesClass = filterClass === 'all' ? true : s.Class?.id === filterClass;

        // Date Filters (using createdAt or Enrollment Date if available, falling back to createdAt for simplicity now)
        const date = new Date(s.createdAt);
        const matchesMonth = filterMonth === 'all' ? true : date.getMonth() === parseInt(filterMonth);
        const matchesYear = filterYear === 'all' ? true : date.getFullYear() === parseInt(filterYear);

        return matchesSearch && matchesStatus && matchesClass && matchesMonth && matchesYear;
    });

    // Unique years for filter
    const years = [...new Set(students.map(s => new Date(s.createdAt).getFullYear()))].sort((a, b) => b - a);

    const downloadTemplate = () => {
        const headers = ["Nome,Email,CPF,Curso,Matricula"];
        const rows = ["Maria Souza,maria@email.com,12345678900,Inglês Básico,MAT-001"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join("\n") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_alunos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');

            const newStudents = lines.slice(1).filter(line => line.trim() !== '').map((line, index) => {
                const values = line.split(',');
                const unitPrefix = user?.unit || user?.unitName || 'Geral';
                return {
                    id: `${unitPrefix}-${Date.now()}-${index}`, // Unit-Based ID
                    unit: unitPrefix,
                    name: values[0] || 'Sem Nome',
                    email: values[1] || '',
                    cpf: values[2] || '',
                    courseName: values[3] || '',
                    registrationNumber: values[4] || '',
                    status: 'active',
                    createdAt: new Date().toISOString()
                };
            });

            if (newStudents.length > 0) {
                setStudents(prev => [...prev, ...newStudents]);
                alert(`${newStudents.length} Alunos importados com sucesso!`);
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset
    };

    return (
        <div className="manager-container">
            <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Gestão de Alunos</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
                        <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Download size={16} /> Modelo CSV
                        </button>
                        <div style={{ position: 'relative' }}>
                            <input type="file" accept=".csv" onChange={handleImport} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                            <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Upload size={16} /> Importar
                            </button>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Novo Aluno
                    </button>
                </div>
            </div>

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
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="filter-select"
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="all">Todas as Turmas</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
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
                                            <div>
                                                <div>{student.Class.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.Class.Course?.name}</div>
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
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)' }} title="Excluir">
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
                    onClose={() => setShowForm(false)}
                    onSave={() => {
                        setShowForm(false);
                        fetchData();
                    }}
                    classes={classes}
                />
            )}
        </div>
    );
};

export default StudentsManager;
