import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Download, BarChart3, PieChart } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const FinancialReportsPage = () => {
    const { user, selectedUnit } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('month'); // month, quarter, year, custom
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchFinancialSummary();
    }, [period, selectedUnit]);

    const fetchFinancialSummary = async () => {
        try {
            setLoading(true);
            const params = {
                unitId: selectedUnit || 'all'
            };

            // Set date range based on period
            const now = new Date();
            if (period === 'month') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                params.startDate = firstDay.toISOString().split('T')[0];
                params.endDate = lastDay.toISOString().split('T')[0];
            } else if (period === 'quarter') {
                const quarter = Math.floor(now.getMonth() / 3);
                const firstDay = new Date(now.getFullYear(), quarter * 3, 1);
                const lastDay = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                params.startDate = firstDay.toISOString().split('T')[0];
                params.endDate = lastDay.toISOString().split('T')[0];
            } else if (period === 'year') {
                params.startDate = `${now.getFullYear()}-01-01`;
                params.endDate = `${now.getFullYear()}-12-31`;
            } else if (period === 'custom' && startDate && endDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }

            const response = await api.get('/reports/financial-summary', { params });
            if (response.data && response.data.data) {
                setSummary(response.data.data);
            } else {
                setSummary(null);
            }
        } catch (error) {
            console.error('Erro ao buscar resumo financeiro:', error);
            setSummary(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const exportToExcel = () => {
        alert('Exportação para Excel será implementada em breve!');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#8E8E93' }}>Carregando...</div>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="vox-card-glass" style={{ padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', margin: '20px' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>
                    Nenhum dado disponível
                </h3>
                <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '600' }}>
                    Não há dados financeiros para o período selecionado.
                </p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-ios-pop">

            {/* Export Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-8px' }}>
                <button
                    onClick={exportToExcel}
                    style={{
                        padding: '12px 24px',
                        background: '#34C759',
                        color: 'white',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(52, 199, 89, 0.3)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Download size={18} /> Exportar Excel
                </button>
            </div>

            {/* Period Selector */}
            <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ fontSize: '14px', fontWeight: '900', color: '#1C1C1E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Período:</label>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {[
                            { value: 'month', label: 'Este Mês' },
                            { value: 'quarter', label: 'Este Trimestre' },
                            { value: 'year', label: 'Este Ano' },
                            { value: 'custom', label: 'Personalizado' }
                        ].map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                style={{
                                    padding: '10px 20px',
                                    background: period === p.value ? '#007AFF' : 'rgba(142, 142, 147, 0.1)',
                                    color: period === p.value ? 'white' : '#1C1C1E',
                                    border: period === p.value ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {period === 'custom' && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    padding: '10px 16px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93' }}>até</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{
                                    padding: '10px 16px',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            />
                            <button
                                onClick={fetchFinancialSummary}
                                style={{
                                    padding: '10px 20px',
                                    background: '#007AFF',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Aplicar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Revenue Card */}
                <div className="vox-card-glass" style={{
                    padding: '28px',
                    background: 'linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(52, 199, 89, 0.05) 100%)',
                    border: '2px solid rgba(52, 199, 89, 0.3)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <TrendingUp size={28} color="#34C759" strokeWidth={2.5} />
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#34C759', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Receitas</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#34C759' }}>
                        {formatCurrency(summary.revenue.total)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#1C1C1E', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>💰 Pago: <strong>{formatCurrency(summary.revenue.paid)}</strong></div>
                        <div>⏳ Pendente: <strong>{formatCurrency(summary.revenue.pending)}</strong></div>
                        <div style={{ color: '#FF3B30' }}>⚠️ Vencido: <strong>{formatCurrency(summary.revenue.overdue)}</strong></div>
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="vox-card-glass" style={{
                    padding: '28px',
                    background: 'linear-gradient(135deg, rgba(255, 59, 48, 0.15) 0%, rgba(255, 59, 48, 0.05) 100%)',
                    border: '2px solid rgba(255, 59, 48, 0.3)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <TrendingDown size={28} color="#FF3B30" strokeWidth={2.5} />
                        <span style={{ fontSize: '11px', fontWeight: '900', color: '#FF3B30', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Despesas</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#FF3B30' }}>
                        {formatCurrency(summary.expenses.total)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#1C1C1E', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>💰 Pago: <strong>{formatCurrency(summary.expenses.paid)}</strong></div>
                        <div>⏳ Pendente: <strong>{formatCurrency(summary.expenses.pending)}</strong></div>
                    </div>
                </div>

                {/* Balance Card */}
                <div className="vox-card-glass" style={{
                    padding: '28px',
                    background: summary.balance.total >= 0
                        ? 'linear-gradient(135deg, rgba(0, 122, 255, 0.15) 0%, rgba(0, 122, 255, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(255, 149, 0, 0.05) 100%)',
                    border: `2px solid ${summary.balance.total >= 0 ? 'rgba(0, 122, 255, 0.3)' : 'rgba(255, 149, 0, 0.3)'}`,
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <DollarSign size={28} color={summary.balance.total >= 0 ? '#007AFF' : '#FF9500'} strokeWidth={2.5} />
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '900',
                            color: summary.balance.total >= 0 ? '#007AFF' : '#FF9500',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>Saldo</span>
                    </div>
                    <div style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        marginBottom: '16px',
                        color: summary.balance.total >= 0 ? '#007AFF' : '#FF9500'
                    }}>
                        {formatCurrency(summary.balance.total)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#1C1C1E', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div>✅ Realizado: <strong>{formatCurrency(summary.balance.realized)}</strong></div>
                        <div>📊 Projetado: <strong>{formatCurrency(summary.balance.projected)}</strong></div>
                    </div>
                </div>
            </div>

            {/* Revenue and Expenses by Category */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Revenue by Category */}
                <div className="vox-card-glass" style={{ padding: '28px', background: 'rgba(255,255,255,0.4)' }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '900',
                        color: '#1C1C1E',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <PieChart size={20} color="#34C759" strokeWidth={2.5} />
                        Receitas por Categoria
                    </h3>
                    {summary.revenue.byCategory && summary.revenue.byCategory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {summary.revenue.byCategory.map((cat, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: 'rgba(52, 199, 89, 0.05)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(52, 199, 89, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: '#34C759'
                                        }}></div>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1C1C1E' }}>{cat.category}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#34C759' }}>
                                            {formatCurrency(cat.total)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>
                                            {cat.count} lançamento(s)
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#8E8E93', fontWeight: '600' }}>
                            Nenhuma receita no período
                        </p>
                    )}
                </div>

                {/* Expenses by Category */}
                <div className="vox-card-glass" style={{ padding: '28px', background: 'rgba(255,255,255,0.4)' }}>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '900',
                        color: '#1C1C1E',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        <BarChart3 size={20} color="#FF3B30" strokeWidth={2.5} />
                        Despesas por Categoria
                    </h3>
                    {summary.expenses.byCategory && summary.expenses.byCategory.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {summary.expenses.byCategory.map((cat, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '16px',
                                    background: 'rgba(255, 59, 48, 0.05)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 59, 48, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: '#FF3B30'
                                        }}></div>
                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#1C1C1E' }}>{cat.category}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '16px', fontWeight: '900', color: '#FF3B30' }}>
                                            {formatCurrency(cat.total)}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>
                                            {cat.count} lançamento(s)
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#8E8E93', fontWeight: '600' }}>
                            Nenhuma despesa no período
                        </p>
                    )}
                </div>
            </div>

            {/* Summary Table */}
            <div className="vox-card-glass" style={{ padding: '28px', background: 'rgba(255,255,255,0.4)' }}>
                <h3 style={{
                    fontSize: '18px',
                    fontWeight: '900',
                    color: '#1C1C1E',
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>Resumo Detalhado</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.1)' }}>
                                <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Categoria</th>
                                <th style={{ textAlign: 'right', padding: '16px', fontSize: '12px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Total</th>
                                <th style={{ textAlign: 'right', padding: '16px', fontSize: '12px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Pago</th>
                                <th style={{ textAlign: 'right', padding: '16px', fontSize: '12px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Pendente</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(52, 199, 89, 0.05)' }}>
                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '900', color: '#34C759' }}>Receitas</td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '900', color: '#34C759' }}>
                                    {formatCurrency(summary.revenue.total)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#34C759' }}>
                                    {formatCurrency(summary.revenue.paid)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#34C759' }}>
                                    {formatCurrency(summary.revenue.pending)}
                                </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(255, 59, 48, 0.05)' }}>
                                <td style={{ padding: '16px', fontSize: '14px', fontWeight: '900', color: '#FF3B30' }}>Despesas</td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '900', color: '#FF3B30' }}>
                                    {formatCurrency(summary.expenses.total)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#FF3B30' }}>
                                    {formatCurrency(summary.expenses.paid)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '700', color: '#FF3B30' }}>
                                    {formatCurrency(summary.expenses.pending)}
                                </td>
                            </tr>
                            <tr style={{ background: 'rgba(0, 122, 255, 0.08)' }}>
                                <td style={{ padding: '16px', fontSize: '16px', fontWeight: '900', color: '#007AFF' }}>Saldo</td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '20px', fontWeight: '900', color: '#007AFF' }}>
                                    {formatCurrency(summary.balance.total)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '900', color: '#007AFF' }}>
                                    {formatCurrency(summary.balance.realized)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '900', color: '#007AFF' }}>
                                    {formatCurrency(summary.balance.projected)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialReportsPage;
