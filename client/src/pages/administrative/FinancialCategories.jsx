import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Layers, ArrowUpCircle, ArrowDownCircle, Calendar, Filter } from 'lucide-react';

const FinancialCategories = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('month'); // 'today', 'month', 'all', 'custom'
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        fetchRecords();
    }, [filterType, customStartDate, customEndDate]);

    const fetchRecords = async () => {
        try {
            const token = localStorage.getItem('token');
            let query = '?limit=10000';

            const today = new Date();
            let start, end;

            switch (filterType) {
                case 'today':
                    // Hoje
                    start = today.toISOString().split('T')[0];
                    end = start;
                    break;
                case 'month':
                    // Este mês
                    const year = today.getFullYear();
                    const month = today.getMonth() + 1;
                    start = `${year}-${String(month).padStart(2, '0')}-01`;
                    const lastDay = new Date(year, month, 0).getDate();
                    end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
                    break;
                case 'custom':
                    // Personalizado
                    if (customStartDate && customEndDate) {
                        start = customStartDate;
                        end = customEndDate;
                    }
                    break;
                case 'all':
                default:
                    // Todo período - não envia filtro de data
                    break;
            }

            if (start && end) {
                query += `&startDate=${start}&endDate=${end}`;
            }

            const finalUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial${query}`;

            console.log('🔍 Filtro aplicado:', filterType);
            console.log('🔍 Período:', { start, end });
            console.log('🔍 URL completa:', finalUrl);

            const res = await fetch(finalUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            console.log('📦 Registros recebidos do backend:', data.length);

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

        console.log('📊 Total de registros recebidos:', records.length);
        console.log('📊 Primeiros 5 registros:', records.slice(0, 5));

        records.forEach(r => {
            const val = parseFloat(r.amount);
            // Normalize category name
            const cat = r.category || 'Outros';

            if (r.direction === 'expense') {
                expenseGroups[cat] = (expenseGroups[cat] || 0) + val;
                totalExpense += val;
            } else if (r.direction === 'income') {
                incomeGroups[cat] = (incomeGroups[cat] || 0) + val;
                totalIncome += val;
            }
        });

        console.log('💰 Receitas por categoria:', incomeGroups);
        console.log('💰 Total de receitas:', totalIncome);
        console.log('💸 Despesas por categoria:', expenseGroups);
        console.log('💸 Total de despesas:', totalExpense);

        return { expenseGroups, incomeGroups, totalExpense, totalIncome };
    };

    const { expenseGroups, incomeGroups, totalExpense, totalIncome } = React.useMemo(() => processData(), [records]);

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

    const getFilterLabel = () => {
        const today = new Date();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        switch (filterType) {
            case 'today':
                return `Hoje - ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
            case 'month':
                return `${monthNames[today.getMonth()]}/${today.getFullYear()}`;
            case 'custom':
                if (customStartDate && customEndDate) {
                    return `${customStartDate.split('-').reverse().join('/')} - ${customEndDate.split('-').reverse().join('/')}`;
                }
                return 'Personalizado';
            case 'all':
            default:
                return 'Todo o Período';
        }
    };

    const CategoryCard = ({ category, value, total, type }) => {
        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        const color = getCategoryColor(category, type);

        return (
            <div className="vox-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden', border: 'none', transition: 'transform 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ padding: '8px', borderRadius: '10px', background: `${color}15`, color: color }}>
                        {type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: color, background: `${color}10`, padding: '4px 8px', borderRadius: '6px' }}>{percent}%</span>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h4 style={{ color: '#8E8E93', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{category}</h4>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1C1E', letterSpacing: '-0.5px' }}>{formatCurrency(value)}</h3>
                    <p style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px' }}>
                        {percent}% do total de {type === 'income' ? 'receitas' : 'despesas'}
                    </p>
                </div>

                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: `${color}20` }}>
                    <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: '0 4px 4px 0' }} />
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            {/* Filters Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1C1C1E', margin: 0 }}>
                        Análise Financeira
                    </h3>
                    <div style={{
                        background: 'white',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#3b82f6'
                    }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        {getFilterLabel()}
                    </div>
                </div>

                {/* Quick Filters */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilterType('today')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: filterType === 'today' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
                            color: filterType === 'today' ? 'white' : '#1C1C1E',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setFilterType('month')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: filterType === 'month' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
                            color: filterType === 'month' ? 'white' : '#1C1C1E',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Este Mês
                    </button>
                    <button
                        onClick={() => setFilterType('all')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: filterType === 'all' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
                            color: filterType === 'all' ? 'white' : '#1C1C1E',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Todo Período
                    </button>
                    <button
                        onClick={() => setFilterType('custom')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            background: filterType === 'custom' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'white',
                            color: filterType === 'custom' ? 'white' : '#1C1C1E',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Personalizado
                    </button>
                </div>

                {/* Custom Date Range */}
                {filterType === 'custom' && (
                    <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#8E8E93', display: 'block', marginBottom: '6px' }}>
                                Data Inicial
                            </label>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E5EA',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#8E8E93', display: 'block', marginBottom: '6px' }}>
                                Data Final
                            </label>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #E5E5EA',
                                    fontSize: '13px',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>


            {loading ? <p>Carregando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        {/* Total Income Card */}
                        <div className="vox-card" style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <ArrowUpCircle size={24} />
                                <span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Total de Receitas</span>
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0', letterSpacing: '-1px' }}>
                                {formatCurrency(totalIncome)}
                            </h2>
                            <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
                                {Object.keys(incomeGroups).length} categoria(s)
                            </p>
                        </div>

                        {/* Total Expense Card */}
                        <div className="vox-card" style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            border: 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <ArrowDownCircle size={24} />
                                <span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Total de Despesas</span>
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0', letterSpacing: '-1px' }}>
                                {formatCurrency(totalExpense)}
                            </h2>
                            <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
                                {Object.keys(expenseGroups).length} categoria(s)
                            </p>
                        </div>

                        {/* Net Result Card */}
                        <div className="vox-card" style={{
                            padding: '24px',
                            background: totalIncome - totalExpense >= 0
                                ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                            border: 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <Layers size={24} />
                                <span style={{ fontSize: '14px', fontWeight: '600', opacity: 0.9 }}>Resultado Líquido</span>
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '8px 0', letterSpacing: '-1px' }}>
                                {formatCurrency(totalIncome - totalExpense)}
                            </h2>
                            <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
                                {totalIncome - totalExpense >= 0 ? 'Superávit' : 'Déficit'}
                            </p>
                        </div>
                    </div>

                    {/* Income Section - PRIMEIRO */}
                    <section>
                        <h4 style={{
                            fontSize: '1.3rem',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#10b981',
                            fontWeight: '800'
                        }}>
                            <div style={{
                                padding: '8px',
                                background: '#10b98115',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <ArrowUpCircle size={24} />
                            </div>
                            Receitas por Categoria
                            <span style={{ fontSize: '0.9rem', color: '#8E8E93', fontWeight: '600' }}>
                                ({Object.keys(incomeGroups).length} {Object.keys(incomeGroups).length === 1 ? 'categoria' : 'categorias'})
                            </span>
                        </h4>
                        {Object.keys(incomeGroups).length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                {Object.entries(incomeGroups)
                                    .sort(([, a], [, b]) => b - a) // Ordenar por valor decrescente
                                    .map(([cat, val]) => (
                                        <CategoryCard key={cat} category={cat} value={val} total={totalIncome} type="income" />
                                    ))}
                            </div>
                        ) : (
                            <div className="vox-card" style={{ padding: '40px', textAlign: 'center', color: '#8E8E93' }}>
                                <p>Nenhuma receita encontrada para o período selecionado.</p>
                            </div>
                        )}
                    </section>

                    {/* Expenses Section - SEGUNDO */}
                    <section>
                        <h4 style={{
                            fontSize: '1.3rem',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            color: '#ef4444',
                            fontWeight: '800'
                        }}>
                            <div style={{
                                padding: '8px',
                                background: '#ef444415',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <ArrowDownCircle size={24} />
                            </div>
                            Despesas por Categoria
                            <span style={{ fontSize: '0.9rem', color: '#8E8E93', fontWeight: '600' }}>
                                ({Object.keys(expenseGroups).length} {Object.keys(expenseGroups).length === 1 ? 'categoria' : 'categorias'})
                            </span>
                        </h4>
                        {Object.keys(expenseGroups).length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
                                {Object.entries(expenseGroups)
                                    .sort(([, a], [, b]) => b - a) // Ordenar por valor decrescente
                                    .map(([cat, val]) => (
                                        <CategoryCard key={cat} category={cat} value={val} total={totalExpense} type="expense" />
                                    ))}
                            </div>
                        ) : (
                            <div className="vox-card" style={{ padding: '40px', textAlign: 'center', color: '#8E8E93' }}>
                                <p>Nenhuma despesa encontrada para o período selecionado.</p>
                            </div>
                        )}
                    </section>

                    {/* Charts Overview */}
                    <section className="section-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="vox-card" style={{ height: '400px', padding: '24px' }}>
                            <h4 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '16px', fontWeight: '800', color: '#10b981' }}>
                                Distribuição de Receitas
                            </h4>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(incomeGroups).map(([name, value]) => ({ name, value }))}
                                        cx="50%" cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {Object.entries(incomeGroups).map(([name, value], index) => (
                                            <Cell key={`cell-${index}`} fill={getCategoryColor(name, 'income')} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val)}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600' }}
                                        itemStyle={{ color: '#1C1C1E' }}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#8E8E93' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="vox-card" style={{ height: '400px', padding: '24px' }}>
                            <h4 style={{ textAlign: 'center', marginBottom: '24px', fontSize: '16px', fontWeight: '800', color: '#ef4444' }}>
                                Distribuição de Despesas
                            </h4>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie
                                        data={Object.entries(expenseGroups).map(([name, value]) => ({ name, value }))}
                                        cx="50%" cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {Object.entries(expenseGroups).map(([name, value], index) => (
                                            <Cell key={`cell-${index}`} fill={getCategoryColor(name, 'expense')} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val)}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '13px', fontWeight: '600' }}
                                        itemStyle={{ color: '#1C1C1E' }}
                                    />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', fontWeight: '500', color: '#8E8E93' }} />
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
