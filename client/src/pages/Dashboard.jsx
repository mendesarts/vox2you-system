import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, CalendarCheck, DollarSign, ArrowUpRight, Store, Award, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import PageHeader from '../components/PageHeader';
import DataCard from '../components/DataCard';
import './dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
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
            const query = unitId && unitId !== 'all' ? `?unitId=${unitId}` : '';
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dashboard/main-stats${query}`);
            if (res.ok) {
                const data = await res.json();
                if (data) setStats(prev => ({ ...prev, ...data }));
            } else {
                console.error("Dashboard error:", await res.text());
            }

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

    if (loading) return <div className="p-10 text-center text-teal-500 font-bold animate-pulse">Carregando dashboard...</div>;
    if (!stats) return <div className="p-4 text-center">Nenhum dado disponível. Recarregue a página.</div>;

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="dashboard-page p-6 max-w-7xl mx-auto space-y-8">
            <PageHeader
                title="Visão Geral da Escola"
                subtitle={`Referência: ${new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`}
                actionLabel={stats.units && stats.units.length > 0 ? "Filtrar Unidade" : null}
                actionIcon={Store}
                onAction={() => document.getElementById('unit-selector-focus').focus()}
            />

            {/* Hidden Focus Target or actually show the selector cleanly */}
            {stats.units && stats.units.length > 0 && (
                <div className="flex justify-end -mt-6 mb-4">
                    <div className="relative">
                        <select
                            id="unit-selector-focus"
                            value={selectedUnit}
                            onChange={handleUnitChange}
                            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium shadow-sm outline-none focus:border-teal-500 cursor-pointer appearance-none pr-8"
                        >
                            <option value="all">Todas as Unidades (Master)</option>
                            <optgroup label="Unidades">
                                {stats.units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </optgroup>
                        </select>
                        <Store className="absolute right-2 top-2.5 text-gray-400 pointer-events-none" size={16} />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* COMMERCIAL STATS */}
                <DataCard title="Comercial" subtitle="Desempenho de Vendas" status="active" statusColor="border-teal-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} className="text-teal-600" />
                                <span className="text-xs font-bold uppercase text-teal-700">Novos Leads</span>
                            </div>
                            <span className="text-2xl font-bold font-heading text-teal-900 dark:text-teal-100">{stats.commercial?.newLeadsMonth || 0}</span>
                        </div>
                        <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                                <Award size={16} className="text-teal-600" />
                                <span className="text-xs font-bold uppercase text-teal-700">Vendas</span>
                            </div>
                            <span className="text-2xl font-bold font-heading text-teal-900 dark:text-teal-100">{stats.commercial?.salesMonth || 0}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                        <span>Taxa de Conversão</span>
                        <span className="font-bold text-gray-800 dark:text-white">
                            {((stats.commercial?.conversionRate || 0) * 100).toFixed(1)}%
                        </span>
                    </div>
                </DataCard>

                {/* FINANCIAL STATS */}
                <DataCard title="Financeiro" subtitle="Fluxo de Caixa Mensal" status="active" statusColor="border-emerald-500">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <DollarSign size={18} className="text-emerald-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Receitas</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{formatMoney(stats.financial?.revenue || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <ArrowUpRight size={18} className="text-rose-500 rotate-45" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Despesas</span>
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">{formatMoney(stats.financial?.expense || 0)}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-lg">
                            <span className="font-bold uppercase text-xs text-gray-500">Saldo</span>
                            <span className={`font-bold font-heading text-lg ${(stats.financial?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatMoney(stats.financial?.balance || 0)}
                            </span>
                        </div>
                    </div>
                </DataCard>

                {/* PEDAGOGICAL STATS */}
                <DataCard title="Pedagógico" subtitle="Retenção e Turmas" status="active" statusColor="border-indigo-500">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center">
                            <div className="flex justify-center mb-2">
                                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
                                    <Users size={20} />
                                </div>
                            </div>
                            <h4 className="text-2xl font-bold font-heading text-indigo-900 dark:text-indigo-100">{stats.pedagogical?.activeStudents || 0}</h4>
                            <span className="text-xs text-indigo-600 uppercase font-bold">Alunos Ativos</span>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center">
                            <div className="flex justify-center mb-2">
                                <div className="bg-white p-2 rounded-full shadow-sm text-indigo-600">
                                    <CalendarCheck size={20} />
                                </div>
                            </div>
                            <h4 className="text-2xl font-bold font-heading text-indigo-900 dark:text-indigo-100">{stats.pedagogical?.activeClasses || 0}</h4>
                            <span className="text-xs text-indigo-600 uppercase font-bold">Turmas Ativas</span>
                        </div>
                    </div>
                </DataCard>
            </div>

            {/* TOP SELLER */}
            {topSeller ? (
                <div className="mt-8">
                    <DataCard title="Destaque do Mês" subtitle="Top Performance em Vendas" status="active" statusColor="border-amber-400">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="h-24 w-24 bg-amber-100 rounded-full flex items-center justify-center text-3xl font-bold text-amber-700 border-4 border-white shadow-xl">
                                {topSeller.profilePicture ? (
                                    <img src={topSeller.profilePicture} alt={topSeller.name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    topSeller.name?.charAt(0) || 'D'
                                )}
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-heading">{topSeller.name}</h3>
                                    <Award className="text-amber-500" size={24} />
                                </div>
                                <p className="text-amber-600 font-medium font-serif italic mb-3">{topSeller.role || 'Consultor'}</p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                                    <span className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-bold">🏆 {topSeller.sales} Vendas</span>
                                    <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full font-bold">💰 {formatMoney(topSeller.totalvalue)}</span>
                                </div>
                            </div>
                        </div>
                    </DataCard>
                </div>
            ) : (
                <div className="mt-8">
                    <DataCard title="Destaque do Mês" subtitle="Aguardando resultados..." statusColor="border-gray-200">
                        <div className="text-center py-8 text-gray-400">
                            Nenhum destaque registrado neste período.
                        </div>
                    </DataCard>
                </div>
            )}

            {/* Security Modal */}
            {user?.forcePasswordChange && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl border-t-8 border-rose-500">
                        <Shield size={64} className="text-rose-500 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ação Necessária</h2>
                        <p className="text-gray-600 mb-6">
                            Você está usando uma senha temporária. Para sua segurança, crie uma nova senha agora.
                        </p>
                        <a href="/settings" className="w-full btn-primary bg-rose-600 hover:bg-rose-700 flex items-center justify-center">
                            Ir para Configurações
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

const DashboardWithBoundary = () => (
    <ErrorBoundary>
        <Dashboard />
    </ErrorBoundary>
);

export default DashboardWithBoundary;
