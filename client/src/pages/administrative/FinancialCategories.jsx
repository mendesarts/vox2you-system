import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Layers, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const FinancialCategories = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/financial');
            const data = await res.json();
            setRecords(data);
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    // Aggregation Logic
    const processData = () => {
        const expenseGroups = {};
        const incomeGroups = {};
        let totalExpense = 0;
        let totalIncome = 0;

        records.forEach(r => {
            const val = parseFloat(r.amount);
            // Normalize category name
            const cat = r.category || 'Outros';

            if (r.direction === 'expense') {
                expenseGroups[cat] = (expenseGroups[cat] || 0) + val;
                totalExpense += val;
            } else {
                incomeGroups[cat] = (incomeGroups[cat] || 0) + val;
                totalIncome += val;
            }
        });

        return { expenseGroups, incomeGroups, totalExpense, totalIncome };
    };

    const { expenseGroups, incomeGroups, totalExpense, totalIncome } = processData();

    // Color Palette helper
    const getCategoryColor = (category, type) => {
        // Pre-defined fancy colors
        const expenseColors = {
            'Aluguel': '#f97316', // Orange
            'Energia': '#eab308', // Yellow
            'Água': '#0ea5e9', // Sky Blue
            'Internet': '#6366f1', // Indigo
            'Salários Adm': '#ef4444', // Red
            'Salários Prof': '#ec4899', // Pink
            'Marketing': '#8b5cf6', // Violet
            'Publicidade Online': '#8b5cf6',
            'Manutenção': '#64748b', // Slate
            'Impostos': '#dc2626', // Red dark
        };

        const incomeColors = {
            'Mensalidade': '#10b981', // Emerald
            'Matrícula': '#14b8a6', // Teal
            'Material Didático': '#3b82f6', // Blue
            'Eventos': '#f59e0b', // Amber
        };

        if (type === 'income') return incomeColors[category] || '#34d399'; // Default Green-ish
        return expenseColors[category] || '#f472b6'; // Default Pink-ish
    };

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const CategoryCard = ({ category, value, total, type }) => {
        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        const color = getCategoryColor(category, type);

        return (
            <div className="control-card" style={{ borderLeft: `4px solid ${color}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -10, top: -10, opacity: 0.1, transform: 'rotate(15deg)' }}>
                    {type === 'income' ? <ArrowUpCircle size={80} color={color} /> : <ArrowDownCircle size={80} color={color} />}
                </div>

                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', zIndex: 1, position: 'relative' }}>{category}</h4>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{formatCurrency(value)}</h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', backgroundColor: color }}></div>
                    </div>
                    <span style={{ color: color, fontWeight: 600 }}>{percent}%</span>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <div className="manager-header" style={{ marginBottom: '30px' }}>
                <h3>Categorias Financeiras</h3>
                <p className="page-subtitle">Visão detalhada de Receitas e Despesas por categoria.</p>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

                    {/* Expenses Section */}
                    <section>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444' }}>
                            <ArrowDownCircle size={20} /> Despesas por Categoria <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>(Total: {formatCurrency(totalExpense)})</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {Object.entries(expenseGroups).map(([cat, val]) => (
                                <CategoryCard key={cat} category={cat} value={val} total={totalExpense} type="expense" />
                            ))}
                        </div>
                    </section>

                    {/* Income Section */}
                    <section>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
                            <ArrowUpCircle size={20} /> Receitas por Categoria <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>(Total: {formatCurrency(totalIncome)})</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                            {Object.entries(incomeGroups).map(([cat, val]) => (
                                <CategoryCard key={cat} category={cat} value={val} total={totalIncome} type="income" />
                            ))}
                        </div>
                    </section>

                    {/* Charts Overview */}
                    <section className="section-grid" style={{ marginTop: '20px' }}>
                        <div className="control-card" style={{ height: '350px' }}>
                            <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>Distribuição de Despesas</h4>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(expenseGroups).map(([name, value]) => ({ name, value }))}
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {Object.entries(expenseGroups).map(([name, value], index) => (
                                            <Cell key={`cell-${index}`} fill={getCategoryColor(name, 'expense')} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="control-card" style={{ height: '350px' }}>
                            <h4 style={{ textAlign: 'center', marginBottom: '20px' }}>Origem das Receitas</h4>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(incomeGroups).map(([name, value]) => ({ name, value }))}
                                        cx="50%" cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {Object.entries(incomeGroups).map(([name, value], index) => (
                                            <Cell key={`cell-${index}`} fill={getCategoryColor(name, 'income')} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default FinancialCategories;
