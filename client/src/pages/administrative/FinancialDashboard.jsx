import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, DollarSign, ArrowDown, ArrowUp, Briefcase, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FinancialManager from './FinancialManager';
import CashFlowManager from './CashFlowManager';
import DREReport from './DREReport';
import FinancialCategories from './FinancialCategories';
import HelpButton from '../../components/HelpButton';
import '../../pages/dashboard.css'; // Import dashboard styles

// Helper StatCard for Financial Dashboard
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

const FinancialDashboard = () => {
    const [stats, setStats] = useState({
        receivableAmount: 0,
        payableAmount: 0,
        revenueData: []
    });
    const [view, setView] = useState('dashboard'); // 'dashboard', 'records', 'cashflow', 'dre', 'categories'

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/dashboard/financial-stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error loading financial stats:', error);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const renderContent = () => {
        if (view === 'cashflow') return <CashFlowManager />;
        if (view === 'records') return <FinancialManager />;
        if (view === 'dre') return <DREReport />;
        if (view === 'categories') return <FinancialCategories />;

        return (
            <div className="dashboard-content animate-fade-in" style={{ padding: 0 }}>
                {/* Actions Header - Compact Horizontal */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', width: '100%' }}>
                    <button className="nav-card-btn theme-purple" onClick={() => setView('records')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><DollarSign size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Lançamentos</span>
                    </button>
                    <button className="nav-card-btn theme-blue" onClick={() => setView('cashflow')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><TrendingUp size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Fluxo de Caixa</span>
                    </button>
                    <button className="nav-card-btn theme-orange" onClick={() => setView('dre')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><Briefcase size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>DRE Gerencial</span>
                    </button>
                    <button className="nav-card-btn theme-teal" onClick={() => setView('categories')} style={{ flex: 1, flexDirection: 'row', padding: '16px', height: 'auto', justifyContent: 'center', minWidth: 0 }}>
                        <div className="icon-box" style={{ width: 40, height: 40, fontSize: '0.9rem' }}><Layers size={20} /></div>
                        <span style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>Categorias</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        title="Contas a Receber"
                        value={formatCurrency(stats.receivableAmount)}
                        icon={TrendingUp}
                        color="#8b5cf6"
                        desc="Pendentes e Vencidas"
                    />
                    <StatCard
                        title="Contas a Pagar"
                        value={formatCurrency(stats.payableAmount)}
                        icon={ArrowDown}
                        color="#ef4444"
                        desc="Despesas previstas (Este Mês)"
                    />
                    <StatCard
                        title="Receita (Últimos 6 meses)"
                        value={formatCurrency(stats.revenueData.reduce((acc, curr) => acc + curr.value, 0))}
                        icon={DollarSign}
                        color="#10b981"
                        desc="Total baixado no período"
                    />
                </div>

                {/* Charts Section */}
                <h3 style={{ marginBottom: '24px', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)' }}>Análise Financeira</h3>
                <div className="chart-card" style={{ height: '400px' }}>
                    <h3 className="card-title">Histórico de Receita (Baixas Realizadas)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={stats.revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                            <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'var(--hover)' }}
                                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className="financial-dashboard page-fade-in" style={{ padding: '0 0 20px 0' }}>
            {/* Note: Header is handled by Secretary.jsx mainly, but we can add sub-header control if needed. 
                 Since this is rendered INSIDE Secretary, we don't duplicate the main Page Header. 
                 But we want to show a 'Back' button if inside a sub-view. */}

            {view !== 'dashboard' && (
                <div style={{ marginBottom: '20px' }}>
                    <button onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>←</span> Voltar ao Painel Financeiro
                    </button>
                </div>
            )}

            {renderContent()}

            <HelpButton context={
                view === 'cashflow' ? 'cash_flow' :
                    view === 'records' ? 'financial_records' :
                        view === 'dre' ? 'dre' :
                            'financial_dashboard'
            } />
        </div>
    );
};

export default FinancialDashboard;
