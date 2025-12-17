import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CalendarCheck, DollarSign, ArrowUpRight, Store, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './dashboard.css';

const Dashboard = () => {
    const { user } = useAuth(); // Need user token logic if useAuth provides api or token
    const [stats, setStats] = useState({
        commercial: { newLeadsMonth: 0, salesMonth: 0, conversionRate: 0 },
        financial: { revenue: 0, expense: 0, balance: 0 },
        pedagogical: { activeStudents: 0, activeClasses: 0 },
        units: []
    });
    const [topSeller, setTopSeller] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedUnit, setSelectedUnit] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async (unitId = '') => {
        try {
            // Build query
            const query = unitId && unitId !== 'all' ? `?unitId=${unitId}` : '';

            // 1. Fetch Main Stats
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dashboard/main-stats${query}`);
            if (res.ok) {
                const data = await res.json();
                if (data) setStats(prev => ({ ...prev, ...data }));
            } else {
                console.error("Dashboard error:", await res.text());
            }

            // 2. Fetch Top Seller (Only if authenticated properly, assuming useAuth exposes token or local storage)
            const token = localStorage.getItem('token');
            if (token) {
                const resSeller = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/stats/top-seller${query}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resSeller.ok) {
                    const sellerData = await resSeller.json();
                    setTopSeller(sellerData);
                }
            }

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
                    <div className="stat-value">{stats.commercial?.newLeadsMonth || 0}</div>
                    <div className="stat-label">{stats.commercial?.salesMonth || 0} Matrículas este mês</div>
                </div>

                {/* Metric 2 - Pedagogical */}
                <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><CalendarCheck size={24} /></div>
                        <span className="stat-change positive">Alunos Ativos</span>
                    </div>
                    <div className="stat-value">{stats.pedagogical?.activeStudents || 0}</div>
                    <div className="stat-label">{stats.pedagogical?.activeClasses || 0} Turmas em andamento</div>
                </div>

                {/* Metric 3 - Financial */}
                <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
                    <div className="stat-header">
                        <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}><DollarSign size={24} /></div>
                        <span className="stat-change positive">Faturamento</span>
                    </div>
                    <div className="stat-value">{formatMoney(stats.financial?.revenue || 0)}</div>
                    <div className="stat-label">Saldo: {formatMoney(stats.financial?.balance || 0)}</div>
                </div>
            </div>

            {/* Team Performance - New Section */}
            <div style={{ marginTop: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={20} /> Desempenho da Equipe (Metas)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {stats.commercial?.teamPerformance && stats.commercial.teamPerformance.length > 0 ? (
                        stats.commercial.teamPerformance.map(member => (
                            <div key={member.id} className="dashboard-card" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: '#3b82f6', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold'
                                    }}>
                                        {member.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{member.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consultor(a)</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Vendas</span>
                                    <strong style={{ color: (member.sales || 0) >= (member.goal || 1) ? '#16a34a' : '#3b82f6' }}>
                                        {member.sales || 0} / {member.goal || 0}
                                    </strong>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${member.progress || 0}%`,
                                        height: '100%',
                                        background: (member.progress || 0) >= 100 ? '#16a34a' : '#3b82f6',
                                        transition: 'width 0.5s ease'
                                    }}></div>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                                    {member.progress || 0}% da meta
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '32px' }}>

                {/* Top Seller Card */}
                <div className="dashboard-card" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)', color: '#78350f', border: 'none' }}>
                    <div className="card-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                        <h3 style={{ color: '#78350f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={24} /> Destaque do Mês
                        </h3>
                    </div>
                    {topSeller ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', height: 'calc(100% - 60px)' }}>
                            <div style={{
                                width: '80px', height: '80px', borderRadius: '50%',
                                border: '4px solid rgba(255,255,255,0.5)', overflow: 'hidden',
                                marginBottom: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {topSeller.profilePicture ? (
                                    <img src={topSeller.profilePicture} alt={topSeller.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FDB931' }}>{topSeller.name?.charAt(0) || 'U'}</span>
                                )}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{topSeller.name || 'Usuário'}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{topSeller.month || '-'}</div>
                            <div style={{
                                marginTop: '12px', background: 'rgba(255,255,255,0.3)',
                                padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold'
                            }}>
                                {topSeller.salesCount || 0} Vendas
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: '24px', textAlign: 'center', opacity: 0.8 }}>
                            Nenhum destaque definido ainda.
                        </div>
                    )}
                </div>

                {/* Financial Breakdown */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3><TrendingUp size={20} /> Saúde Financeira</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Receita</span>
                            <span style={{ fontWeight: 700, color: '#059669' }}>{formatMoney(stats.financial?.revenue || 0)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Despesa</span>
                            <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatMoney(stats.financial?.expense || 0)}</span>
                        </div>
                        <div style={{ padding: '8px 0', borderTop: '1px solid var(--border)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>Saldo</span>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: (stats.financial?.balance || 0) >= 0 ? '#3b82f6' : '#ef4444' }}>
                                {formatMoney(stats.financial?.balance || 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conversion */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3><ArrowUpRight size={20} /> Conversão</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', height: '100%' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: '#3b82f6', lineHeight: 1 }}>
                            {stats.commercial?.conversionRate || 0}%
                        </div>
                        <p style={{ color: 'var(--text-muted)', marginTop: '8px', textAlign: 'center' }}>
                            Dos leads tornaram-se alunos este mês.
                        </p>
                    </div>
                </div>

            </div>


            {/* Security Modal - First Access */}
            {
                user?.forcePasswordChange && (
                    <div className="modal-overlay" style={{ backdropFilter: 'blur(8px)', zIndex: 9999 }}>
                        <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center', padding: '40px' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <Shield size={64} className="text-warning" style={{ color: '#f59e0b' }} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '10px', color: 'var(--text-main)' }}>Ação Necessária</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                                Detectamos que você está usando uma senha temporária ou padrão. Para garantir a segurança da sua conta e dos dados da escola, é obrigatório criar uma nova senha agora.
                            </p>

                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '25px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                                <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Como alterar:</strong>
                                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.9rem', color: '#475569' }}>
                                    <li>Clique no botão abaixo para ir às Configurações.</li>
                                    <li>Acesse a aba <strong>Segurança</strong> ou <strong>Meu Perfil</strong>.</li>
                                    <li>Digite uma nova senha segura.</li>
                                </ol>
                            </div>

                            <a href="/settings" className="btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
                                Ir para Configurações e Alterar Senha
                            </a>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Dashboard;
