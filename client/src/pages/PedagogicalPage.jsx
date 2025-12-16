import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen,
    Users,
    CheckCircle,
    AlertCircle,
    ArrowUpRight,
    FileSpreadsheet,
    Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AttendanceManager from './pedagogical/AttendanceManager';
import MentorshipsManager from './pedagogical/MentorshipsManager';
import StudentsManager from './pedagogical/StudentsManager';
import ClassesManager from './pedagogical/ClassesManager';
import HelpButton from '../components/HelpButton';
import './secretary.css';
import './dashboard.css'; // Import dashboard styles
import { useLocation } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, desc, onClick }) => (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
        <div className="stat-header">
            <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                <Icon size={24} />
            </div>
        </div>
        <div className="stat-content">
            <h3 className="stat-value">{value}</h3>
            <p className="stat-title">{title}</p>
            {desc && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{desc}</p>}
        </div>
    </div>
);

const PedagogicalPage = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [subTab, setSubTab] = useState('dashboard');
    const [statsData, setStatsData] = useState({
        activeStudents: 0,
        activeClasses: 0,
        attendanceRate: '0%',
        atRisk: 0,
        scheduledMentorships: 0,
        completedMentorships: 0
    });
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (location.state?.subTab) {
            setSubTab(location.state.subTab);
        }
    }, [location]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/pedagogical/stats');
            if (res.ok) {
                const data = await res.json();
                setStatsData(data);
            }
        } catch (error) {
            console.error('Error fetching pedagogical stats:', error);
        }
    };

    // Data Tools
    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/export/csv`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao exportar');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (error) {
            console.error(error);
            alert('Erro ao exportar dados.');
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const csvContent = evt.target.result;
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
                    alert(`Importação concluída!\nSucesso: ${data.success}\nFalhas: ${data.failed}`);
                    fetchStats();
                } else {
                    alert('Erro na importação: ' + data.error);
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao enviar arquivo.');
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    const canManageData = ['master', 'franchisee', 'manager', 'admin', 'pedagogical_leader'].includes(user?.role);

    const stats = [
        { title: 'Meus Alunos', value: statsData.activeStudents, icon: Users, color: '#3b82f6', desc: 'Matrículas vigentes', onClick: () => setSubTab('students') },
        { title: 'Minhas Turmas', value: statsData.activeClasses, icon: BookOpen, color: '#8b5cf6', desc: 'Classes em andamento', onClick: () => setSubTab('classes') },
        { title: 'Frequência Média', value: statsData.attendanceRate, icon: CheckCircle, color: '#10b981', desc: 'Últimos 30 dias', onClick: () => setSubTab('attendance') },
        { title: 'Alunos em Risco', value: statsData.atRisk, icon: AlertCircle, color: '#ef4444', desc: 'Baixa frequência', onClick: () => setSubTab('students') },
    ];

    const mentorshipStats = [
        { title: 'Mentorias Agendadas', value: statsData.scheduledMentorships, icon: CheckCircle, color: '#f59e0b', desc: 'Próximas sessões', onClick: () => setSubTab('mentorships') },
        { title: 'Mentorias Realizadas', value: statsData.completedMentorships, icon: Users, color: '#ec4899', desc: 'Total realizado', onClick: () => setSubTab('mentorships') }
    ];

    const renderContent = () => {
        if (subTab === 'mentorships') return <MentorshipsManager />;
        if (subTab === 'attendance') return <AttendanceManager />;
        if (subTab === 'students') return <StudentsManager />;
        if (subTab === 'classes') return <ClassesManager />;

        return (
            <div className="dashboard-content animate-fade-in" style={{ padding: 0 }}>
                {/* Actions Header - Compact Horizontal */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', width: '100%' }}>
                    <button className="nav-card-btn theme-teal" onClick={() => setSubTab('students')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><Users size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Meus Alunos</span>
                    </button>
                    <button className="nav-card-btn theme-purple" onClick={() => setSubTab('classes')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><BookOpen size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Minhas Turmas</span>
                    </button>
                    <button className="nav-card-btn theme-green" onClick={() => setSubTab('attendance')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><CheckCircle size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Frequência</span>
                    </button>
                    <button className="nav-card-btn theme-orange" onClick={() => setSubTab('mentorships')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><Users size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Mentorias</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                    {mentorshipStats.map((stat, index) => (
                        <StatCard key={`m-${index}`} {...stat} />
                    ))}
                </div>

                {/* Pedagogical Charts Section */}
                <h3 style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Desempenho Pedagógico</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>

                    {/* Attendance Chart */}
                    <div className="chart-card" style={{ height: '400px' }}>
                        <h3 className="card-title">Frequência (Últimos 6 Meses)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <BarChart data={[
                                { name: 'Jul', value: 85 }, { name: 'Ago', value: 88 },
                                { name: 'Set', value: 82 }, { name: 'Out', value: 90 },
                                { name: 'Nov', value: 87 }, { name: 'Dez', value: 92 }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'var(--hover)' }} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Mentorship Status */}
                    <div className="chart-card" style={{ height: '400px' }}>
                        <h3 className="card-title">Status das Mentorias</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Realizadas', value: statsData.completedMentorships || 10 },
                                        { name: 'Agendadas', value: statsData.scheduledMentorships || 5 },
                                        { name: 'Pendentes', value: (statsData.activeStudents || 20) - (statsData.completedMentorships || 10) }
                                    ]}
                                    cx="50%" cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#10b981" /> {/* Realizadas */}
                                    <Cell fill="#f59e0b" /> {/* Agendadas */}
                                    <Cell fill="#ef4444" /> {/* Pendentes */}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="secretary-page page-fade-in">
            <header className="page-header">
                <div>
                    <h2 className="page-title">Pedagógico</h2>
                    <p className="page-subtitle">Gestão de Alunos, Turmas e Frequência.</p>
                </div>
                {canManageData && (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '16px' }}>
                        <button className="btn-secondary" onClick={handleExport} title="Exportar Alunos">
                            <FileSpreadsheet size={18} />
                        </button>
                        <button className="btn-secondary" onClick={handleImportClick} title="Importar Alunos">
                            <Upload size={18} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".csv"
                            onChange={handleFileChange}
                        />
                    </div>
                )}
                {subTab !== 'dashboard' && (
                    <button onClick={() => setSubTab('dashboard')} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>←</span> Voltar ao Painel
                    </button>
                )}
            </header>

            <div className="secretary-content">
                {renderContent()}
            </div>

            <HelpButton context="pedagogical" />
        </div>
    );
};

export default PedagogicalPage;
