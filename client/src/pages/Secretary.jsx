import React, { useState, useEffect } from 'react';
import {
    Users, GraduationCap, FileText, Briefcase, DollarSign, BookOpen, BrainCircuit, Activity, UserPlus, ChevronRight, PieChart as PieIcon, BarChart2, TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StudentsManager from './pedagogical/StudentsManager';
import ClassesManager from './pedagogical/ClassesManager';
import ReportsDashboard from './administrative/ReportsDashboard';
import EnrollmentWizard from './pedagogical/StudentRegistrationWizard';
import HelpButton from '../components/HelpButton';

import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import DataCard from '../components/DataCard';

import DashboardFilters from '../components/DashboardFilters';

const Secretary = () => {
    const { user, selectedUnit } = useAuth();
    const navigate = useNavigate();
    const [adminSubTab, setAdminSubTab] = useState('dashboard'); // 'dashboard', 'students', 'classes', 'reports'
    const [showEnrollmentWizard, setShowEnrollmentWizard] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    const [stats, setStats] = useState({
        activeStudents: 0, activeStudentsByCourse: {}, activeClasses: 0, activeClassesByCourse: {}, plannedClasses: 0, pendingContracts: 0, startedClasses: 0, finishedClasses: 0
    });

    const [charts, setCharts] = useState({ genderData: [], ageData: [], neighborhoodData: [], courseData: [] });

    const displayName = user?.name ? user.name.split(' ').slice(0, 2).join(' ') : 'Admin';

    const fetchAdminData = async (unitId = '', startDate = '', endDate = '') => {
        setLoading(true);
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const targetUnit = unitId || (unitId === 0 ? 0 : 'all');
            let query = `?unitId=${targetUnit}`;
            if (startDate) query += `&startDate=${startDate}`;
            if (endDate) query += `&endDate=${endDate}`;

            const [s, c] = await Promise.all([
                fetch(`${apiBase}/dashboard/admin-stats${query}`, { headers }).then(r => r.json()),
                fetch(`${apiBase}/dashboard/admin-charts${query}`, { headers }).then(r => r.json())
            ]);

            if (s && !s.error) {
                setStats(s);
            } else if (s?.error) {
                console.error('Admin Stats Error:', s.error);
            }

            if (c && !c.error) {
                setCharts({
                    genderData: Array.isArray(c.genderData) ? c.genderData : [],
                    ageData: Array.isArray(c.ageData) ? c.ageData : [],
                    neighborhoodData: Array.isArray(c.neighborhoodData) ? c.neighborhoodData : [],
                    courseData: Array.isArray(c.courseData) ? c.courseData : []
                });
            } else if (c?.error) {
                console.error('Admin Charts Error:', c.error);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleFilterChange = ({ startDate, endDate }) => {
        setDateRange({ startDate, endDate });
    };

    useEffect(() => {
        if (adminSubTab === 'dashboard') {
            fetchAdminData(selectedUnit, dateRange.startDate, dateRange.endDate);
        }
    }, [selectedUnit, dateRange, adminSubTab]);

    const renderDashboard = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Quick Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <button onClick={() => setAdminSubTab('students')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(52, 199, 89, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(52, 199, 89, 0.1)', color: '#34C759', borderRadius: '12px' }}><Users size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Gerenciar Alunos</span></div>
                </button>
                <button onClick={() => setAdminSubTab('classes')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(175, 82, 222, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(175, 82, 222, 0.1)', color: '#AF52DE', borderRadius: '12px' }}><BookOpen size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Gerenciar Turmas</span></div>
                </button>
                <button onClick={() => setAdminSubTab('reports')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 149, 0, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', borderRadius: '12px' }}><FileText size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Relatórios</span></div>
                </button>
            </div>

            <DashboardFilters
                onFilterChange={handleFilterChange}
                loading={loading}
            />

            {/* Stats Summary */}
            <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)', marginTop: '-16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                    <FileText size={18} color="#AF52DE" />
                    <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '1px', color: '#1C1C1E' }}>ADMINISTRATIVO</h3>
                </div>

                <div style={{ fontSize: '10px', fontWeight: '900', color: '#AF52DE', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Turmas</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(175, 82, 222, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', color: '#AF52DE', marginBottom: '8px', textTransform: 'uppercase' }}>Ativas</div>
                        <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.activeClasses || 0}</h4>
                    </div>
                    <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Iniciadas</div>
                        <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.startedClasses || 0}</h4>
                    </div>
                    <div style={{ background: 'rgba(255, 59, 48, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Encerradas</div>
                        <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.finishedClasses || 0}</h4>
                    </div>
                </div>

                <div style={{ fontSize: '10px', fontWeight: '900', color: '#AF52DE', marginTop: '20px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taxas</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div style={{ background: 'rgba(255, 59, 48, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Cancelam.</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.cancellationRate || '0.0%'}</h4>
                    </div>
                    <div style={{ background: 'rgba(255, 149, 0, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', color: '#FF9500', marginBottom: '8px', textTransform: 'uppercase' }}>Evasão</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.evasionRate || '0.0%'}</h4>
                    </div>
                    <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Trancam.</div>
                        <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.lockRate || '0.0%'}</h4>
                    </div>
                </div>

                <div style={{ marginTop: '16px', background: 'rgba(142, 142, 147, 0.05)', padding: '16px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px', textTransform: 'uppercase' }}>Contratos Pendentes</div>
                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.pendingContracts || 0}</h4>
                </div>
            </div>

            {/* Analysis Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div className="vox-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <PieIcon size={18} color="var(--ios-teal)" />
                        <h3 style={{ fontWeight: '900', margin: 0 }}>Gênero & Idade</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={charts.genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {charts.genderData.map((e, i) => <Cell key={i} fill={['#007AFF', '#FF2D55', '#8E8E93'][i % 3]} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="vox-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <BarChart2 size={18} color="var(--ios-teal)" />
                        <h3 style={{ fontWeight: '900', margin: 0 }}>Bairros Populares</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.neighborhoodData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} style={{ fontSize: '11px', fontWeight: '800' }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="var(--ios-teal)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );

    if (showEnrollmentWizard) {
        return <EnrollmentWizard classes={[]} onClose={() => { setShowEnrollmentWizard(false); fetchAdminData(); }} />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Header Master */}
            <header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setShowEnrollmentWizard(true)} className="btn-primary">
                    <UserPlus size={18} /> Nova Matrícula
                </button>
            </header>

            {/* Administrativo Sub-navigation is handled inside the content area or keep it as header */}
            {/* Removing the main tab toggle as financial is now its own page */}


            {/* Content Area */}
            <div style={{ transition: 'all 0.4s ease' }}>
                {adminSubTab === 'dashboard' ? renderDashboard() : (
                    <div>
                        {adminSubTab === 'students' && <StudentsManager />}
                        {adminSubTab === 'classes' && <ClassesManager />}
                        {adminSubTab === 'reports' && <ReportsDashboard />}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Secretary;
