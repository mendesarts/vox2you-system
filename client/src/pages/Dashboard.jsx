import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CalendarCheck, DollarSign, ArrowUpRight, Store } from 'lucide-react';
import './dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        commercial: { newLeadsMonth: 0, salesMonth: 0, conversionRate: 0 },
        financial: { revenue: 0, expense: 0, balance: 0 },
        pedagogical: { activeStudents: 0, activeClasses: 0 },
        units: []
    });
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async (unitId = '') => {
        try {
            // Build query
            const query = unitId && unitId !== 'all' ? `?unitId=${unitId}` : '';
            const res = await fetch(`http://localhost:3000/api/dashboard/main-stats${query}`);
            const data = await res.json();
            setStats(data);
            if (unitId) setSelectedUnit(unitId);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnitChange = (e) => {
        const newVal = e.target.value;
        setSelectedUnit(newVal);
        fetchStats(newVal);
    };

    if (loading) return <div>Carregando dashboard...</div>;

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="dashboard-page page-fade-in">
            <header className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <div>
                    <h2 className="page-title">Visão Geral da Escola</h2>
                    <p className="page-subtitle">Acompanhe os principais indicadores de performance (KPIs).</p>
                </div>

                {/* Unit Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Referência: {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                    {stats.units && stats.units.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                            <Store size={18} color="#64748b" />
                            <select
                                value={selectedUnit}
                                onChange={handleUnitChange}
                                style={{ border: 'none', background: 'transparent', fontSize: '0.9rem', color: '#0f172a', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="all">Todas as Unidades (Master)</option>
                                <optgroup label="Unidades">
                                    {stats.units.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    )}
                </div>
            </header>

            {/* Top Row - Key Metrics */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
                {/* Metric 1 - Commercial */}
                <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}><Users size={24} /></div>
                        <span className="stat-change positive">Novos Leads</span>
                    </div>
                    <div className="stat-value">{stats.commercial.newLeadsMonth}</div>
                    <div className="stat-label">{stats.commercial.salesMonth} Matrículas este mês</div>
                </div>

                {/* Metric 2 - Pedagogical */}
                <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><CalendarCheck size={24} /></div>
                        <span className="stat-change positive">Alunos Ativos</span>
                    </div>
                    <div className="stat-value">{stats.pedagogical.activeStudents}</div>
                    <div className="stat-label">{stats.pedagogical.activeClasses} Turmas em andamento</div>
                </div>

                {/* Metric 3 - Financial */}
                <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}><DollarSign size={24} /></div>
                        <span className="stat-change positive">Faturamento</span>
                    </div>
                    <div className="stat-value">{formatMoney(stats.financial.revenue)}</div>
                    <div className="stat-label">Saldo: {formatMoney(stats.financial.balance)}</div>
                </div>
            </div>

            {/* Team Performance - New Section */}
            <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} /> Desempenho da Equipe (Metas)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {stats.commercial.teamPerformance && stats.commercial.teamPerformance.length > 0 ? (
                        stats.commercial.teamPerformance.map(member => (
                            <div key={member.id} className="dashboard-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: '#3b82f6', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultor(a)</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Vendas</span>
                                    <strong style={{ color: member.sales >= member.goal ? '#16a34a' : '#3b82f6' }}>
                                        {member.sales} / {member.goal}
                                    </strong>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${member.progress}%`,
                                        height: '100%',
                                        background: member.progress >= 100 ? '#16a34a' : '#3b82f6',
                                        transition: 'width 0.5s ease'
                                    }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                                    {member.progress}% da meta
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '20px', background: '#f8fafc', borderRadius: '8px', color: '#64748b', textAlign: 'center' }}>
                            Nenhum consultor encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Second Row - Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '32px' }}>

                {/* Financial Breakdown */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3><TrendingUp size={20} /> Saúde Financeira (Mês)</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '24px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Receita</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>{formatMoney(stats.financial.revenue)}</div>
                        </div>
                        <div style={{ height: '40px', width: '1px', background: 'var(--border)' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Despesa</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>{formatMoney(stats.financial.expense)}</div>
                        </div>
                        <div style={{ height: '40px', width: '1px', background: 'var(--border)' }}></div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Resultado</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stats.financial.balance >= 0 ? '#3b82f6' : '#ef4444' }}>
                                {formatMoney(stats.financial.balance)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conversion */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3><ArrowUpRight size={20} /> Conversão de Vendas</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', height: '100%' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>
                            {stats.commercial.conversionRate}%
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                            Dos leads tornaram-se alunos este mês.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
