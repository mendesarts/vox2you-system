import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Download, Filter, Printer } from 'lucide-react';
import ErrorBoundary from '../../components/ErrorBoundary';

const ReportsDashboard = () => {
    const [activeReport, setActiveReport] = useState('classes'); // classes, students, financial
    const [data, setData] = useState([]); // Re-added
    const [loading, setLoading] = useState(true); // Re-added
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const [courses, setCourses] = useState([]);
    const [classesList, setClassesList] = useState([]);

    useEffect(() => {
        fetchReportData();
        fetchCourses();
        fetchClasses();
    }, [activeReport]);

    const fetchCourses = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/courses');
            const json = await res.json();
            setCourses(json || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/classes');
            const json = await res.json();
            setClassesList(json || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReportData = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeReport === 'classes') endpoint = 'http://localhost:3000/api/classes';
            if (activeReport === 'students') endpoint = 'http://localhost:3000/api/students';

            if (endpoint) {
                const res = await fetch(endpoint);
                const jsonData = await res.json();
                setData(jsonData);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const getFilteredData = () => {
        if (!data) return [];
        return data.filter(item => {
            let matchStatus = true;
            let matchCourse = true;
            let matchClass = true;
            let matchDate = true;

            // Status Filter
            if (filterStatus) {
                matchStatus = item.status === filterStatus;
            }

            // Course Filter
            if (filterCourse) {
                if (activeReport === 'classes') matchCourse = item.courseId === filterCourse;
                if (activeReport === 'students') matchCourse = item.Class?.courseId === filterCourse;
            }

            // Class Filter
            if (filterClass) {
                if (activeReport === 'classes') matchClass = item.id === filterClass;
                if (activeReport === 'students') matchClass = item.classId === filterClass;
            }

            // Date Range Filter
            if (filterStartDate || filterEndDate) {
                const itemDateStr = activeReport === 'classes' ? item.startDate : item.createdAt;
                if (itemDateStr) {
                    const itemDate = new Date(itemDateStr);
                    if (filterStartDate) {
                        matchDate = matchDate && itemDate >= new Date(filterStartDate);
                    }
                    if (filterEndDate) {
                        // Set end date to end of day
                        const end = new Date(filterEndDate);
                        end.setHours(23, 59, 59, 999);
                        matchDate = matchDate && itemDate <= end;
                    }
                } else {
                    // If no date present on item, decide if should show. 
                    // Usually if filter applied and no date, filter out.
                    if (filterStartDate || filterEndDate) matchDate = false;
                }
            }

            return matchStatus && matchCourse && matchClass && matchDate;
        });
    };

    const filteredData = getFilteredData();

    const renderClassesReport = () => (
        <div className="report-table-container">
            <h3>Relatório Geral de Turmas</h3>
            <table className="finance-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Curso</th>
                        <th>Professor</th>
                        <th>Alunos</th>
                        <th>Início</th>
                        <th>Fim (Previsto)</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((c) => (
                        <tr key={c.id}>
                            <td>{c.name}</td>
                            <td>{c.Course?.name}</td>
                            <td>{c.professor?.name || 'N/A'}</td>
                            <td>{c.Students?.length || 0}/{c.capacity || 0}</td>
                            <td>{c.startDate ? new Date(c.startDate).toLocaleDateString() : '-'}</td>
                            <td>{c.endDate ? new Date(c.endDate).toLocaleDateString() : '-'}</td>
                            <td>
                                <span className={`status-badge ${c.status === 'active' ? 'paid' : c.status === 'planned' ? 'pending' : 'overdue'}`}>
                                    {c.status === 'active' ? 'Ativa' : c.status === 'planned' ? 'Pré-matrícula' : 'Encerrada'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderStudentsReport = () => (
        <div className="report-table-container">
            <h3>Relatório de Base de Alunos</h3>
            <table className="finance-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Turma Atual</th>
                        <th>Status</th>
                        <th>Contrato</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((s) => (
                        <tr key={s.id}>
                            <td>{s.name}</td>
                            <td>{s.email}</td>
                            <td>{s.mobile}</td>
                            <td>{s.Class?.name || '-'}</td>
                            <td>{s.status}</td>
                            <td>{s.contractStatus === 'signed' ? 'Assinado' : 'Pendente'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="animate-fade-in reports-page">
            <div className="print-header" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>Vox2You - Relatório Gerencial</h1>
                    <div>
                        <p><strong>Gerado em:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                        <p><strong>Tipo:</strong> {activeReport === 'classes' ? 'Turmas' : 'Alunos'}</p>
                    </div>
                </div>
                <div style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                    {filterStartDate && <span><strong>Início:</strong> {new Date(filterStartDate).toLocaleDateString()}  </span>}
                    {filterEndDate && <span><strong>Fim:</strong> {new Date(filterEndDate).toLocaleDateString()}  </span>}
                    {filterStatus && <span><strong>Status:</strong> {filterStatus}  </span>}
                    {filterCourse && <span><strong>Curso ID:</strong> {filterCourse}  </span>}
                </div>
            </div>

            <div className="manager-header no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                    <h3>Relatórios e Exportação</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Gere listagens e relatórios operacionais</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={handlePrint}>
                        <Printer size={16} /> Imprimir / PDF
                    </button>
                    <button className="btn-primary">
                        <Download size={16} /> Exportar CSV
                    </button>
                </div>
            </div>

            <div className="secretary-tabs no-print" style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                <button
                    className={`tab-btn ${activeReport === 'classes' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveReport('classes');
                        setFilterStatus(''); setFilterCourse(''); setFilterClass(''); setFilterStartDate(''); setFilterEndDate('');
                    }}
                >
                    Turmas
                </button>
                <button
                    className={`tab-btn ${activeReport === 'students' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveReport('students');
                        setFilterStatus(''); setFilterCourse(''); setFilterClass(''); setFilterStartDate(''); setFilterEndDate('');
                    }}
                >
                    Alunos
                </button>
                <button
                    className={`tab-btn ${activeReport === 'financial' ? 'active' : ''}`}
                    onClick={() => alert('Em desenvolvimento')}
                >
                    Financeiro
                </button>
            </div>

            {/* FILTERS BAR */}
            <div className="control-card no-print" style={{ padding: '15px', marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
                    <Filter size={18} /> Filtros:
                </div>

                {/* Date Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem' }}>De:</span>
                    <input type="date" className="input-field" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} style={{ padding: '8px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '0.8rem' }}>Até:</span>
                    <input type="date" className="input-field" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} style={{ padding: '8px' }} />
                </div>

                <select className="input-field" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: '8px', minWidth: '120px' }}>
                    <option value="">Status: Todos</option>
                    {activeReport === 'classes' && (
                        <>
                            <option value="active">Ativa</option>
                            <option value="planned">Pré-matrícula</option>
                            <option value="finished">Encerrada</option>
                        </>
                    )}
                    {activeReport === 'students' && (
                        <>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                        </>
                    )}
                </select>

                <select className="input-field" value={filterCourse} onChange={e => setFilterCourse(e.target.value)} style={{ padding: '8px', minWidth: '120px' }}>
                    <option value="">Curso: Todos</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <select className="input-field" value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '8px', minWidth: '120px' }}>
                    <option value="">Turma: Todas</option>
                    {classesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                {(filterStatus || filterCourse || filterClass || filterStartDate || filterEndDate) && (
                    <button onClick={() => { setFilterStatus(''); setFilterCourse(''); setFilterClass(''); setFilterStartDate(''); setFilterEndDate(''); }} style={{ border: 'none', background: 'none', color: 'var(--error)', cursor: 'pointer', marginLeft: 'auto' }}>
                        Limpar Filtros
                    </button>
                )}
            </div>

            {loading ? <p>Carregando dados...</p> : (
                <div className="report-content">
                    {activeReport === 'classes' && renderClassesReport()}
                    {activeReport === 'students' && renderStudentsReport()}
                </div>
            )}

            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 2cm;
                    }
                    body {
                        background-color: white;
                        color: black;
                        font-family: 'Times New Roman', Times, serif;
                    }
                    .no-print, 
                    .secretary-tabs, 
                    .manager-header, 
                    .sidebar, 
                    .control-card { 
                        display: none !important; 
                    }
                    .reports-page {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        position: absolute;
                        top: 0;
                        left: 0;
                        background: white;
                    }
                    .print-header {
                        display: block !important;
                    }
                    .report-table-container {
                        width: 100% !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 10pt;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 4px;
                        text-align: left;
                    }
                    th {
                        background-color: #f0f0f0 !important;
                        color: black !important;
                        font-weight: bold;
                    }
                    .status-badge {
                        background: none !important;
                        color: black !important;
                        border: none;
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
};

export default function ReportsDashboardWithBoundary() {
    return (
        <ErrorBoundary>
            <ReportsDashboard />
        </ErrorBoundary>
    );
}
