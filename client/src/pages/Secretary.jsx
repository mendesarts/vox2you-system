import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    FileText,
    Settings,
    UserPlus,
    LogOut,
    Menu,
    X,
    Bell,
    Receipt,
    Briefcase,
    DollarSign,
    BookOpen,
    HelpCircle,
    BrainCircuit // Added
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentsManager from './pedagogical/StudentsManager';
import ClassesManager from './pedagogical/ClassesManager';
import ReportsDashboard from './administrative/ReportsDashboard';
import FinancialDashboard from './administrative/FinancialDashboard';
import EnrollmentWizard from './pedagogical/StudentRegistrationWizard'; // Import Wizard
import HelpButton from '../components/HelpButton';
import AIAdvisorModal from './components/AIAdvisorModal';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './dashboard.css'; // Import dashboard styles

// StatCard component adapted from Dashboard.jsx
const StatCard = ({ title, value, icon: Icon, color, desc, onClick, details }) => (
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
            {/* Course Breakdown specific for Secretary page */}
            {details && Object.keys(details).length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '0.75rem' }}>
                    {Object.entries(details).slice(0, 3).map(([course, count]) => (
                        <div key={course} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', color: 'var(--text-secondary)' }}>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>{course}</span>
                            <span style={{ fontWeight: 600 }}>{count}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const Secretary = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('administrative'); // 'administrative', 'financial'
    const [adminSubTab, setAdminSubTab] = useState('dashboard'); // 'dashboard', 'students', 'classes', 'reports'
    const [showEnrollmentWizard, setShowEnrollmentWizard] = useState(false);
    const [studentFilters, setStudentFilters] = useState({}); // To pass filters to StudentsManager
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    // Filter Stats Data
    const [stats, setStats] = useState({
        activeStudents: 0,
        activeStudentsByCourse: {},
        activeClasses: 0,
        activeClassesByCourse: {},
        plannedClasses: 0,
        pendingContracts: 0
    });

    const [charts, setCharts] = useState({
        genderData: [],
        ageData: [],
        neighborhoodData: [],
        courseData: []
    });

    useEffect(() => {
        if (activeTab === 'administrative' && adminSubTab === 'dashboard') {
            fetchAdminData();
        }
    }, [activeTab, adminSubTab]);

    const fetchAdminData = async () => {
        try {
            const resStats = await fetch('http://localhost:3000/api/dashboard/admin-stats');
            if (resStats.ok) setStats(await resStats.json());

            const resCharts = await fetch('http://localhost:3000/api/dashboard/admin-charts');
            if (resCharts.ok) setCharts(await resCharts.json());

        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    };

    const getHelpContext = () => {
        if (activeTab === 'financial') return null;
        switch (adminSubTab) {
            case 'students': return 'students_manager';
            case 'classes': return 'classes_manager';
            default: return 'secretary_dashboard';
        }
    };

    const handleStatClick = (statTitle) => {
        if (statTitle === 'Alunos Ativos') {
            setStudentFilters({ status: 'active' });
            setAdminSubTab('students');
        } else if (statTitle === 'Turmas Ativas') {
            setAdminSubTab('classes');
        } else if (statTitle === 'Turmas em Formação') {
            setAdminSubTab('classes');
        } else if (statTitle === 'Contratos Pendentes') {
            setStudentFilters({ status: 'active' });
            setAdminSubTab('students'); // Ideally pass filter for "issue" students
            // For now, just go to students list
        }
    };

    const tabs = [
        { id: 'administrative', label: 'Administrativo', icon: Briefcase },
        { id: 'financial', label: 'Financeiro', icon: DollarSign },
    ];

    const adminStats = [
        {
            title: 'Alunos Ativos',
            value: stats.activeStudents,
            icon: Users,
            color: '#3b82f6',
            desc: 'Matrículas vigentes',
            details: stats.activeStudentsByCourse,
            onClick: () => handleStatClick('Alunos Ativos')
        },
        {
            title: 'Turmas Ativas',
            value: stats.activeClasses,
            icon: BookOpen,
            color: '#8b5cf6',
            desc: 'Classes em andamento',
            details: stats.activeClassesByCourse,
            onClick: () => handleStatClick('Turmas Ativas')
        },
        {
            title: 'Turmas em Formação',
            value: stats.plannedClasses,
            icon: CalendarCheck => <Receipt size={24} />, // Check icon workaround or use imported
            color: '#f59e0b', // Amber
            desc: 'Aguardando início',
            onClick: () => handleStatClick('Turmas em Formação')
        },
        {
            title: 'Contratos Pendentes',
            value: stats.pendingContracts,
            icon: FileText,
            color: '#ef4444', // Red
            desc: 'Contrato ou Taxa pendente',
            onClick: () => handleStatClick('Contratos Pendentes')
        }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'administrative':
                return (
                    <div>
                        {/* Sub-tab Navigation (Only visible if NOT in Dashboard to allow back?) 
                            Actually, preserving the sidebar-like buttons or top tabs is better.
                            Let's keep the dashboard as the 'home' of this tab. 
                        */}

                        {adminSubTab === 'dashboard' && (
                            <div className="dashboard-content animate-fade-in" style={{ padding: 0 }}>
                                {/* Quick Navigation - Preserved Buttons */}
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', width: '100%' }}>
                                    <button className="nav-card-btn theme-teal" onClick={() => setAdminSubTab('students')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><Users size={20} /></div>
                                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Gerenciar Alunos</span>
                                    </button>
                                    <button className="nav-card-btn theme-purple" onClick={() => setAdminSubTab('classes')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><BookOpen size={20} /></div>
                                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Gerenciar Turmas</span>
                                    </button>
                                    <button className="nav-card-btn theme-orange" onClick={() => setAdminSubTab('reports')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><FileText size={20} /></div>
                                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Relatórios</span>
                                    </button>
                                </div>

                                {/* Stats Grid */}
                                <div className="stats-grid">
                                    {adminStats.map((stat, index) => (
                                        <StatCard key={index} {...stat} />
                                    ))}
                                </div>

                                {/* Charts Section */}
                                <h3 style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Análise Demográfica e Acadêmica</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
                                    {/* Pie Charts Row */}
                                    <div className="chart-card" style={{ height: '350px' }}>
                                        <h3 className="card-title">Distribuição por Gênero</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <PieChart>
                                                <Pie
                                                    data={charts.genderData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={100}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {charts.genderData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899', '#9ca3af'][index % 3]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                                <Legend verticalAlign="bottom" height={36} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="chart-card" style={{ height: '350px' }}>
                                        <h3 className="card-title">Faixa Etária</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={charts.ageData} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                                                <XAxis type="number" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                                                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} />
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Bar Charts Row */}
                                    <div className="chart-card" style={{ height: '400px', gridColumn: 'span 2' }}>
                                        <h3 className="card-title">Alunos por Bairro (Top 10)</h3>
                                        <ResponsiveContainer width="100%" height="90%">
                                            <BarChart data={charts.neighborhoodData} margin={{ bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                                                <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} angle={-15} textAnchor="end" interval={0} height={60} />
                                                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {adminSubTab === 'students' && (
                            <div>
                                <button onClick={() => setAdminSubTab('dashboard')} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>←</span> Voltar ao Painel
                                </button>
                                <StudentsManager initialFilters={studentFilters} />
                            </div>
                        )}

                        {adminSubTab === 'classes' && (
                            <div>
                                <button onClick={() => setAdminSubTab('dashboard')} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>←</span> Voltar ao Painel
                                </button>
                                <ClassesManager />
                            </div>
                        )}

                        {adminSubTab === 'reports' && (
                            <div>
                                <button onClick={() => setAdminSubTab('dashboard')} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span>←</span> Voltar ao Painel
                                </button>
                                <ReportsDashboard />
                            </div>
                        )}

                    </div>
                );
            case 'financial':
                return <FinancialDashboard />;
            default:
                return null;
        }
    };

    if (showEnrollmentWizard) {
        return <EnrollmentWizard onClose={() => { setShowEnrollmentWizard(false); fetchAdminData(); }} />;
    }

    return (
        <div className="secretary-page page-fade-in">
            {/* Header styled like Dashboard */}
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="page-title">Administrativo</h2>
                    <p className="page-subtitle">Gestão burocrática, acadêmica e financeira.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* AI Advisor Button */}
                    <button
                        onClick={() => setShowAIAdvisor(true)}
                        className="btn-primary btn-ai-analysis"
                        style={{
                            background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                        }}
                    >
                        <BrainCircuit size={18} /> Análise IA
                    </button>

                    <button onClick={() => setShowEnrollmentWizard(true)} className="btn-primary">
                        <UserPlus size={18} /> Nova Matrícula
                    </button>
                </div>
            </header>

            {/* Tabs Row */}
            <div className="secretary-tabs" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                {tabs.map((tab) => (
                    <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => { setActiveTab(tab.id); setAdminSubTab('dashboard'); }}>
                        <tab.icon size={18} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="secretary-content">
                {renderContent()}
            </div>

            {/* Help Button - Context sensitive */}
            {getHelpContext() && <HelpButton context={getHelpContext()} />}

            {showAIAdvisor && <AIAdvisorModal onClose={() => setShowAIAdvisor(false)} />}
        </div>
    );
};

export default Secretary;
