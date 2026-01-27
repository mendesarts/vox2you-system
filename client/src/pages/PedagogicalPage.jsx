import React, { useState, useEffect, useRef } from 'react';
import {
    BookOpen, Users, CheckCircle, AlertCircle, FileSpreadsheet, Upload, Filter, ChevronLeft, Calendar, Activity, ClipboardList, PieChart as PieIcon, BarChart2, TrendingUp, GraduationCap
} from 'lucide-react';
import DataCard from '../components/DataCard';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import AttendanceManager from './pedagogical/AttendanceManager';
import MentorshipsManager from './pedagogical/MentorshipsManager';
import StudentsManager from './pedagogical/StudentsManager';
import ClassesManager from './pedagogical/ClassesManager';
import HelpButton from '../components/HelpButton';
import { useLocation, useNavigate } from 'react-router-dom';

import DashboardFilters from '../components/DashboardFilters';

const PedagogicalPage = () => {
    const { user, selectedUnit } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Helper: Format Days (e.g. ["Qui"] -> "Quinta")
    const formatDays = (days) => {
        if (!days) return '';
        let d = days;
        if (typeof days === 'string') {
            try { d = JSON.parse(days); } catch (e) { d = [days]; }
        }
        if (!Array.isArray(d)) return days;

        const map = {
            'Dom': 'Domingo', 'Seg': 'Segunda', 'Ter': 'Terça', 'Qua': 'Quarta',
            'Qui': 'Quinta', 'Sex': 'Sexta', 'Sab': 'Sábado'
        };
        return d.map(day => map[day] || day).join(', ');
    };

    // Helper: Format Time (e.g. "19:00:00" -> "19h")
    const formatTime = (t) => {
        if (!t) return '';
        return t.split(':')[0] + 'h';
    };
    const [subTab, setSubTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [loading, setLoading] = useState(false);
    const [statsData, setStatsData] = useState({
        activeStudents: 0,
        activeClasses: 0,
        attendanceRate: '0%',
        atRisk: 0,
        scheduledMentorships: 0,
        completedMentorships: 0
    });
    const [chartsData, setChartsData] = useState({
        genderData: [],
        ageData: [],
        cityData: [],
        neighborhoodData: [],
        frequencyData: []
    });

    const displayName = user?.name ? user.name.split(' ').slice(0, 2).join(' ') : 'Educador';

    const fetchStats = async (unitId = '', startDate = '', endDate = '') => {
        try {
            const token = localStorage.getItem('token');
            const targetUnit = unitId || (unitId === 0 ? 0 : 'all');
            let query = `?unitId=${targetUnit}`;
            if (startDate) query += `&startDate=${startDate}`;
            if (endDate) query += `&endDate=${endDate}`;

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dashboard/main-stats${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.pedagogical) setStatsData(data.pedagogical);
            }
        } catch (error) { console.error(error); }
    };

    const fetchChartsData = async (unitId = '', startDate = '', endDate = '') => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const targetUnit = unitId || (unitId === 0 ? 0 : 'all');
            let query = `?unitId=${targetUnit}`;
            if (startDate) query += `&startDate=${startDate}`;
            if (endDate) query += `&endDate=${endDate}`;

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dashboard/admin-charts${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setChartsData(await res.json());
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleFilterChange = ({ startDate, endDate }) => {
        setDateRange({ startDate, endDate });
    };

    const [classes, setClasses] = useState([]);

    useEffect(() => {
        if (location.state?.subTab) setSubTab(location.state.subTab);
        fetchClasses();
    }, [location]);

    useEffect(() => {
        if (subTab === 'dashboard') {
            fetchStats(selectedUnit, dateRange.startDate, dateRange.endDate);
            fetchChartsData(selectedUnit, dateRange.startDate, dateRange.endDate);
        }
    }, [selectedUnit, dateRange, subTab]);

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/classes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Sort by start date (ascending)
                const sorted = data.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
                setClasses(sorted);
            }
        } catch (error) { console.error(error); }
    };

    const renderDashboard = () => (
        <div className="animate-ios-pop" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <DashboardFilters
                onFilterChange={handleFilterChange}
                loading={loading}
                user={user}
            />

            {/* Quick Actions Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <button onClick={() => setSubTab('students')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(52, 199, 89, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(52, 199, 89, 0.1)', color: '#34C759', borderRadius: '12px' }}><Users size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Gerenciar Alunos</span></div>
                </button>
                <button onClick={() => setSubTab('classes')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(175, 82, 222, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(175, 82, 222, 0.1)', color: '#AF52DE', borderRadius: '12px' }}><BookOpen size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Gerenciar Turmas</span></div>
                </button>
                <button onClick={() => setSubTab('attendance')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0, 122, 255, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', borderRadius: '12px' }}><CheckCircle size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Lançar Chamada</span></div>
                </button>
                <button onClick={() => setSubTab('mentorships')} className="vox-card" style={{ border: 'none', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255, 149, 0, 0.05)', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ padding: '10px', background: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', borderRadius: '12px' }}><TrendingUp size={20} /></div>
                    <div style={{ textAlign: 'left' }}><span style={{ fontWeight: '900', fontSize: '15px' }}>Mentorias</span></div>
                </button>
            </div>

            {/* Main Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <DataCard title="Alunos Ativos" variant="teal">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{statsData.activeStudents || 0}</div>
                        <Activity size={24} opacity={0.3} />
                    </div>
                </DataCard>
                <DataCard title="Alunos Formados" variant="gold">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900' }}>{statsData.graduatedStudents || 0}</div>
                        <GraduationCap size={24} opacity={0.3} />
                    </div>
                </DataCard>
                <DataCard title="Mentorias" variant="white">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#AF52DE' }}>{statsData.completedMentorships || 0}</div>
                        <TrendingUp size={24} color="#AF52DE" opacity={0.3} />
                    </div>
                </DataCard>
                <DataCard title="Presença" variant="white">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#34C759' }}>{statsData.attendanceRate || '0%'}</div>
                        <CheckCircle size={24} color="#34C759" opacity={0.3} />
                    </div>
                </DataCard>
                <DataCard title="Alunos em Risco" variant="white" onClick={() => navigate('/reports/students-at-risk')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#FF3B30' }}>{statsData.atRisk || 0}</div>
                        <AlertCircle size={24} color="#FF3B30" opacity={0.3} />
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.5, marginTop: '4px' }}>FREQUÊNCIA -75%</div>
                </DataCard>
                <DataCard title="Mentoria/Aluno" variant="white">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#000000' }}>{statsData.mentorshipRate || '0.0'}</div>
                        <TrendingUp size={24} color="#000000" opacity={0.3} />
                    </div>
                </DataCard>
            </div>

            {/* Active Classes Row */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1C1C1E', margin: 0 }}>
                        Minhas Turmas <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: '600' }}>({classes.length})</span>
                    </h3>
                </div>

                {classes.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px dashed rgba(0,0,0,0.1)' }}>
                        <p style={{ color: '#8E8E93', fontWeight: 'bold' }}>Nenhuma turma encontrada</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {classes.map(cls => (
                            <div key={cls.id} className="vox-card" style={{ minWidth: '260px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '4px solid var(--ios-teal)' }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1C1C1E' }}>
                                        {cls.classNumber ? `Turma ${cls.classNumber} - ` : ''}{cls.name}
                                    </h4>
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase' }}>{cls.module || cls.Course?.name || 'Módulo Geral'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#48484a', background: 'rgba(0,0,0,0.03)', padding: '8px', borderRadius: '8px' }}>
                                    <Calendar size={14} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontWeight: '600' }}>
                                            {formatDays(cls.days)} • {formatTime(cls.startTime)} às {formatTime(cls.endTime)}
                                        </span>
                                        {cls.startDate && (
                                            <span style={{ fontSize: '10px', color: '#8E8E93' }}>
                                                Início: {cls.startDate.split('-').reverse().slice(0, 2).join('/')} • Fim: {cls.endDate ? cls.endDate.split('-').reverse().slice(0, 2).join('/') : '?'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: cls.status === 'active' ? '#34C759' : '#FF3B30', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', background: cls.status === 'active' ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)' }}>
                                        {cls.status === 'active' ? 'Em Andamento' : 'Encerrada'}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93' }}>{cls.Students?.length || 0}/{cls.capacity || 20} vagas</span>
                                        <Users size={14} color="#8E8E93" />
                                    </div>
                                </div>
                                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600', marginTop: '-8px' }}>
                                    Prof. {cls.professorName || user?.name?.split(' ')[0] || 'Designado'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div className="vox-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <PieIcon size={18} color="var(--ios-teal)" />
                        <h3 style={{ fontWeight: '900', margin: 0 }}>Gênero & Perfil</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartsData.genderData || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(chartsData.genderData || []).map((e, i) => <Cell key={i} fill={['#007AFF', '#FF2D55', '#8E8E93'][i % 3]} />)}
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
                        <h3 style={{ fontWeight: '900', margin: 0 }}>Faixa Etária</h3>
                    </div>
                    <div style={{ flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartsData.ageData || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                                <XAxis dataKey="name" style={{ fontSize: '11px', fontWeight: '800' }} />
                                <YAxis style={{ fontSize: '11px', fontWeight: '800' }} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    formatter={(value) => [`${value} ${value === 1 ? 'Aluno' : 'Alunos'}`, 'Total']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="var(--ios-teal)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Unified Page Header */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {subTab !== 'dashboard' && (
                        <button
                            onClick={() => setSubTab('dashboard')}
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: '#fff',
                                border: '1px solid #e5e5ea',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>
            </header >

            <div style={{ flex: 1 }}>
                {subTab === 'dashboard' ? renderDashboard() : (
                    <div className="animate-ios-pop">
                        {subTab === 'mentorships' && <MentorshipsManager />}
                        {subTab === 'attendance' && <AttendanceManager />}
                        {subTab === 'students' && <StudentsManager />}
                        {subTab === 'classes' && <ClassesManager />}
                    </div>
                )}
            </div>

            <HelpButton context="pedagogical" />
        </div >
    );
};

export default PedagogicalPage;
