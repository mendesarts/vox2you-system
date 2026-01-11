import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DREReport = () => {
    const { user } = useAuth();
    const [year, setYear] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [financialData, setFinancialData] = useState([]); // Array of records
    const [showOnlyPaid, setShowOnlyPaid] = useState(false); // Novo: filtro de status

    useEffect(() => {
        fetchYearlyData();
    }, [year]);

    const fetchYearlyData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial?startDate=${startDate}&endDate=${endDate}&limit=10000`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setFinancialData(data);
                console.log('📊 DRE - Dados carregados:', data.length, 'registros');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        if (!val) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    };

    // Spreadsheet Structure Definitions
    const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    // Helper to sum value for a category in a specific month (0-11)
    const getValue = (category, monthIndex, isExpense = false) => {
        const monthRecords = financialData.filter(r => {
            if (!r.dueDate) return false;
            const d = new Date(r.dueDate);
            // Normalizar categoria para comparação case-insensitive
            const recordCat = (r.category || '').toUpperCase();
            const searchCat = (category || '').toUpperCase();

            // Match exato ou parcial
            const catMatch = recordCat === searchCat ||
                recordCat.includes(searchCat) ||
                searchCat.includes(recordCat);

            return d.getMonth() === monthIndex && catMatch && r.status !== 'cancelled';
        });

        // Filter for PAID only if showOnlyPaid is true
        const filteredRecords = showOnlyPaid
            ? monthRecords.filter(r => r.status === 'paid')
            : monthRecords;

        return filteredRecords.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    };

    // Helper to Sum Multiple Categories
    const getGroupValue = (categories, monthIndex) => {
        return categories.reduce((acc, cat) => acc + getValue(cat, monthIndex), 0);
    };

    // Log categorias únicas para debug
    React.useEffect(() => {
        if (financialData.length > 0) {
            const uniqueCategories = [...new Set(financialData.map(r => r.category))].sort();
            console.log('📊 DRE - Categorias disponíveis:', uniqueCategories);
            console.log('📊 DRE - Total de registros:', financialData.length);
            console.log('📊 DRE - Registros pagos:', financialData.filter(r => r.status === 'paid').length);
        }
    }, [financialData]);

    const renderRow = (label, category, isBold = false, indent = 0, isGroup = false, groupCategories = []) => {
        const values = MONTHS.map((_, idx) => {
            if (isGroup) return getGroupValue(groupCategories, idx);
            return getValue(category, idx);
        });
        const total = values.reduce((a, b) => a + b, 0);

        return (
            <tr key={label} style={{ backgroundColor: isBold ? '#f8fafc' : 'white', fontWeight: isBold ? 'bold' : 'normal' }}>
                <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', paddingLeft: `${indent * 20 + 8}px`, color: '#334155' }}>
                    {label}
                </td>
                {values.map((v, i) => (
                    <td key={i} style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: v < 0 ? 'red' : '#334155', fontSize: '13px' }}>
                        {formatCurrency(v)}
                    </td>
                ))}
                <td style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>
                    {formatCurrency(total)}
                </td>
            </tr>
        );
    };

    // Derived Rows Logic - Obter categorias dinâmicas dos dados
    const getUniqueCategories = (direction) => {
        const categories = [...new Set(
            financialData
                .filter(r => r.direction === direction)
                .map(r => r.category)
                .filter(Boolean)
        )].sort();
        return categories;
    };

    const incomeCategories = getUniqueCategories('income');
    const expenseCategories = getUniqueCategories('expense');

    return (
        <div className="dre-report page-fade-in" style={{ padding: '24px 0', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#1C1C1E', letterSpacing: '-0.5px' }}>Demonstrativo do Resultado</h1>
                    <p style={{ fontSize: '15px', color: '#8E8E93', marginTop: '4px' }}>
                        {showOnlyPaid ? 'Apenas Pagos (Regime de Caixa)' : 'Todos os Registros (Pago + Pendente)'} • {year}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => setShowOnlyPaid(!showOnlyPaid)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: showOnlyPaid ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'white',
                            color: showOnlyPaid ? 'white' : '#1C1C1E',
                            fontSize: '14px',
                            fontWeight: '600',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {showOnlyPaid ? '✓ Apenas Pagos' : 'Todos'}
                    </button>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                paddingRight: '32px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1C1C1E',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                appearance: 'none'
                            }}
                        >
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                        <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#8E8E93' }} />
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={() => window.print()}
                        style={{ height: '40px', padding: '0 20px', borderRadius: '12px', fontSize: '14px', fontWeight: '600' }}
                    >
                        <Printer size={18} style={{ marginRight: '8px' }} /> Imprimir
                    </button>
                </div>
            </div>

            <div className="vox-card" style={{ overflowX: 'auto', padding: 0, borderRadius: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                    <thead>
                        <tr style={{ background: '#F2F2F7', color: '#1C1C1E', textAlign: 'right' }}>
                            <th style={{ padding: '16px', textAlign: 'left', minWidth: '250px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', color: '#8E8E93', letterSpacing: '0.5px' }}>INDICADOR</th>
                            {MONTHS.map(m => <th key={m} style={{ padding: '16px', fontSize: '12px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase' }}>{m.substring(0, 3)}</th>)}
                            <th style={{ padding: '16px', minWidth: '100px', fontSize: '12px', fontWeight: '900', color: '#1C1C1E', textTransform: 'uppercase' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* REVENUE */}
                        <tr style={{ background: '#f0fdf4' }}><td colSpan={14} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#166534', letterSpacing: '0.5px' }}>RECEITAS</td></tr>
                        {incomeCategories.map(cat => renderRow(cat, cat, false, 1))}
                        {/* Sum of Income */}
                        {(() => {
                            const values = MONTHS.map((_, idx) => getGroupValue(incomeCategories, idx));
                            const total = values.reduce((a, b) => a + b, 0);
                            return (
                                <tr style={{ backgroundColor: '#dcfce7', fontWeight: '800' }}>
                                    <td style={{ padding: '12px 16px', color: '#14532d', fontSize: '13px' }}>RECEITA TOTAL</td>
                                    {values.map((v, i) => <td key={i} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#14532d' }}>{formatCurrency(v)}</td>)}
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#14532d' }}>{formatCurrency(total)}</td>
                                </tr>
                            );
                        })()}

                        {/* EXPENSES */}
                        <tr style={{ background: '#fef2f2' }}><td colSpan={14} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '800', color: '#991b1b', marginTop: '16px' }}>DESPESAS</td></tr>
                        {expenseCategories.map(cat => renderRow(cat, cat, false, 1))}
                        {/* Sum of Expenses */}
                        {(() => {
                            const values = MONTHS.map((_, idx) => getGroupValue(expenseCategories, idx));
                            const total = values.reduce((a, b) => a + b, 0);
                            return (
                                <tr style={{ backgroundColor: '#fee2e2', fontWeight: '800' }}>
                                    <td style={{ padding: '12px 16px', color: '#7f1d1d', fontSize: '13px' }}>DESPESA TOTAL</td>
                                    {values.map((v, i) => <td key={i} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#7f1d1d' }}>{formatCurrency(v)}</td>)}
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', color: '#7f1d1d' }}>{formatCurrency(total)}</td>
                                </tr>
                            );
                        })()}

                        {/* Final Result */}
                        <tr style={{ height: '32px' }}><td colSpan={14}></td></tr>
                        {(() => {
                            const getMonthResult = (monthIdx) => {
                                const statusFilter = showOnlyPaid ? 'paid' : null;
                                const income = financialData.filter(r => {
                                    const matchMonth = new Date(r.dueDate).getMonth() === monthIdx;
                                    const matchDirection = r.direction === 'income';
                                    const matchStatus = statusFilter ? r.status === statusFilter : r.status !== 'cancelled';
                                    return matchMonth && matchDirection && matchStatus;
                                }).reduce((a, b) => a + Number(b.amount), 0);

                                const expense = financialData.filter(r => {
                                    const matchMonth = new Date(r.dueDate).getMonth() === monthIdx;
                                    const matchDirection = r.direction === 'expense';
                                    const matchStatus = statusFilter ? r.status === statusFilter : r.status !== 'cancelled';
                                    return matchMonth && matchDirection && matchStatus;
                                }).reduce((a, b) => a + Number(b.amount), 0);

                                return income - expense;
                            };
                            const results = MONTHS.map((_, idx) => getMonthResult(idx));
                            const totalResult = results.reduce((a, b) => a + b, 0);

                            return (
                                <tr style={{ backgroundColor: '#1C1C1E', color: 'white', fontWeight: '900', fontSize: '15px' }}>
                                    <td style={{ padding: '20px 16px', borderRadius: '0 0 0 16px' }}>RESULTADO LÍQUIDO</td>
                                    {results.map((v, i) => <td key={i} style={{ padding: '20px 16px', textAlign: 'right', color: v < 0 ? '#ff453a' : '#30d158' }}>{formatCurrency(v)}</td>)}
                                    <td style={{ padding: '20px 16px', textAlign: 'right', borderRadius: '0 0 16px 0', color: totalResult < 0 ? '#ff453a' : '#30d158' }}>{formatCurrency(totalResult)}</td>
                                </tr>
                            );
                        })()}

                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '24px', fontSize: '13px', color: '#8E8E93', textAlign: 'center' }}>
                * Valores baseados em lançamentos com status "Pago" (Regime de Caixa).
            </div>
        </div>
    );
};

export default DREReport;
