import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Users, Calendar, DollarSign, Target, Award, Briefcase,
    ChevronRight, Phone, UserPlus, XCircle, PieChart, Info, BookOpen, Activity, Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardFilters from '../components/DashboardFilters';
import DataCard from '../components/DataCard';
import { api } from '../services/api';

const CommercialDashboard = () => {
    const { user, selectedUnit, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // Strategy: Load cached data first (Speed/Stability)
    useEffect(() => {
        try {
            const cached = localStorage.getItem('dash_stats_user_v3'); // Corrected and Versioned Key
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.stats) setStats(parsed.stats);
                if (parsed.classes) setClasses(parsed.classes);
                setLoading(false);
            }
        } catch (e) {
            console.error('Cache load error', e);
            localStorage.removeItem('dash_stats_user_v3');
        }

        // Always fetch fresh data on mount (in background if cache hit)
        fetchStats();
    }, []);

    const handleFilterChange = ({ startDate, endDate }) => {
        setDateRange({ startDate, endDate });
    };

    useEffect(() => {
        if (user) {
            fetchStats(selectedUnit, dateRange.startDate, dateRange.endDate);
        }
    }, [selectedUnit, dateRange, user]);

    const fetchStats = async (unitId = '', startDate = '', endDate = '') => {
        setLoading(true);
        try {
            const query = `?unitId=${unitId || (unitId === 0 ? 0 : '')}&startDate=${startDate}&endDate=${endDate}`;

            // Fetch My Stats (User Focused)
            const statsData = await api.get(`/dashboard/my-stats${query}`);

            setStats(statsData);

            // Classes are now returned within my-stats
            const validClasses = Array.isArray(statsData.classes) ? statsData.classes : [];
            setClasses(validClasses);

            // Save to Cache (Update)
            localStorage.setItem('dash_stats_user_v3', JSON.stringify({
                stats: statsData,
                classes: validClasses,
                timestamp: Date.now()
            }));

        } catch (error) {
            console.error('Falha carregando dashboard:', error);
            localStorage.removeItem('dash_stats_user_v3');
        } finally {
            setLoading(false);
        }
    };



    const formatMoney = (val) => {
        if (val === undefined || val === null) return 'R$ 0,00';
        const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : Number(val);
        return isNaN(num) ? 'R$ 0,00' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const getUserRoleLabel = () => {
        if (!user) return 'Usuário';
        const roleMap = {
            1: 'Master',
            2: 'Diretor',
            3: 'Consultor',
            4: 'Franqueado',
            41: 'Consultor', // added mapping for role ID 41
            // add more mappings as needed
        };
        // If role is a string, check if it represents a number
        if (typeof user.role === 'string') {
            const num = Number(user.role);
            if (!isNaN(num)) {
                return roleMap[num] || 'Usuário';
            }
            return user.role.charAt(0).toUpperCase() + user.role.slice(1);
        }
        // If role is a number, look up directly
        if (typeof user.role === 'number') {
            return roleMap[user.role] || 'Usuário';
        }
        // Fallback to roleId if present (numeric)
        if (typeof user.roleId === 'number') {
            return roleMap[user.roleId] || 'Usuário';
        }
        return 'Usuário';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Data não def.';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        } catch (e) {
            return dateString;
        }
    };


    if (authLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando perfil...</div>;

    // Calculated metrics
    const goalProgress = String(stats?.commercial?.goalProgress || '0').replace('%', '');

    const safeCount = (val) => {
        if (Array.isArray(val)) return val.length;
        if (typeof val === 'object' && val !== null) return 0; // Should not happen for count fields
        return val || 0;
    };
    const convRate = String(stats?.commercial?.conversionRate || '0').replace('%', '');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }} className="animate-ios-pop">

            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            </div>

            <DashboardFilters
                onFilterChange={handleFilterChange}
                loading={loading}
                user={user || {}}
            />

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="vox-card" style={{ height: '140px', opacity: 0.5 }}></div>)}
                </div>
            ) : (
                <>
                    {/* Primary Performance Row */}
                    <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                            <Store size={18} color="#007AFF" />
                            <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '1px', color: '#1C1C1E' }}>MEU DESEMPENHO</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                            <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Leads</div>
                                <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{safeCount(stats?.commercial?.leads)}</h4>
                            </div>
                            <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Atendimentos</div>
                                <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{safeCount(stats?.commercial?.appointments)}</h4>
                            </div>
                            <div style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#34C759', marginBottom: '8px', textTransform: 'uppercase' }}>Tx Conversão</div>
                                <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.commercial?.conversionRate || '0%'}</h4>
                            </div>
                            <div style={{ background: 'rgba(255, 149, 0, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF9500', marginBottom: '8px', textTransform: 'uppercase' }}>Matrículas</div>
                                <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{safeCount(stats?.commercial?.sales)}</h4>
                            </div>
                            <div style={{ background: 'rgba(255, 214, 10, 0.08)', padding: '16px', borderRadius: '16px', gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#FFD60A', textTransform: 'uppercase' }}>Meta Atingida</div>
                                    <div style={{ fontSize: '11px', fontWeight: '900' }}>{safeCount(stats?.commercial?.sales)} / {safeCount(stats?.commercial?.goal)}</div>
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '12px' }}>{stats?.commercial?.goalProgress || '0%'}</div>
                                <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: stats?.commercial?.goalProgress || '0%', height: '100%', background: '#FFD60A', transition: 'width 1s ease-out' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Metrics Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                        <DataCard title="Ligações Realizadas">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Phone size={20} color="#007AFF" />
                                <span style={{ fontSize: '24px', fontWeight: '900' }}>{safeCount(stats?.commercial?.callsCount)}</span>
                            </div>
                        </DataCard>

                        <DataCard title="Leads Perdidos">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <XCircle size={20} color="#FF3B30" />
                                <span style={{ fontSize: '24px', fontWeight: '900' }}>{safeCount(stats?.commercial?.lostLeadsCount)}</span>
                            </div>
                        </DataCard>
                    </div>

                    {/* Classes and Vacancies Section */}
                    <div className="vox-card-glass" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(52, 199, 89, 0.1)', color: '#34C759', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <BookOpen size={20} />
                                </div>
                                <h3 style={{ fontWeight: '900', margin: 0 }}>Vagas Disponíveis (Unidade)</h3>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                            {Array.isArray(classes) && classes.length > 0 ? classes.filter(c => c && c.id).map(cls => {
                                const capacity = cls.capacity || 1;
                                const fillPercentage = (cls.enrolled / capacity) * 100;
                                return (
                                    <div key={cls.id} style={{ padding: '20px', background: 'rgba(0,0,0,0.03)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>{cls.courseName}</div>
                                                    <div style={{ fontWeight: '900', fontSize: '18px', marginBottom: '8px' }}>{cls.name}</div>

                                                    {/* Health Bar Effect */}
                                                    <div style={{
                                                        height: '8px',
                                                        width: '100%',
                                                        background: '#FF3B30', // Red background (Damage/Filled)
                                                        borderRadius: '4px',
                                                        overflow: 'hidden',
                                                        position: 'relative'
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${(cls.vacancies / capacity) * 100}%`, // Width = Available %
                                                            background: '#007AFF', // Blue foreground (Health/Available)
                                                            borderRadius: '4px',
                                                            transition: 'width 0.5s ease-out'
                                                        }}></div>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '4px', fontWeight: '700', color: '#8E8E93' }}>
                                                        <span>{cls.enrolled} matriculados</span>
                                                        <span>{capacity} total</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                                                    <div style={{ fontSize: '24px', fontWeight: '900', color: cls.vacancies > 0 ? '#007AFF' : '#FF3B30' }}>{cls.vacancies}</div>
                                                    <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.5, color: cls.vacancies > 0 ? '#007AFF' : '#FF3B30' }}>VAGAS</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#1C1C1E', opacity: 0.8 }}>
                                                <div>
                                                    <span style={{ fontWeight: '800', display: 'block', fontSize: '9px', color: '#8E8E93' }}>INÍCIO</span>
                                                    {formatDate(cls.startDate)}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '800', display: 'block', fontSize: '9px', color: '#8E8E93' }}>TÉRMINO</span>
                                                    {formatDate(cls.endDate)}
                                                </div>
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <span style={{ fontWeight: '800', display: 'block', fontSize: '9px', color: '#8E8E93' }}>RESPONSÁVEL</span>
                                                    {cls.professorName}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden', marginTop: '12px' }}>
                                            <div style={{ width: `${fillPercentage}%`, height: '100%', background: fillPercentage > 90 ? '#FF3B30' : 'var(--ios-teal)', transition: '0.4s' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '10px', fontWeight: '800', opacity: 0.6 }}>
                                            <span>{cls.enrolled} matriculados</span>
                                            <span>Capacidade: {cls.capacity}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#8E8E93' }}>
                                    Nenhuma turma ativa ou planejada encontrada para esta unidade.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Funnel Performance Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                        <div className="vox-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Activity size={20} color="var(--ios-teal)" />
                                <h4 style={{ fontWeight: '900', margin: 0 }}>Meu Desempenho Comercial</h4>
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', alignItems: 'center', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--ios-teal)' }}>{convRate}%</div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>TAXA DE CONV.</div>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'rgba(0,0,0,0.05)' }}></div>
                                <div>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#5856D6' }}>{formatMoney(stats?.commercial?.revenueMonth || 0)}</div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>RECEITA GERADA</div>
                                </div>
                                <div style={{ width: '1px', height: '40px', background: 'rgba(0,0,0,0.05)' }}></div>
                                <div>
                                    <div style={{ fontSize: '28px', fontWeight: '900', color: '#FF9500' }}>{stats?.commercial?.totalSales || 0}</div>
                                    <div style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5 }}>VENDAS TOTAIS (LIFETIME)</div>
                                </div>
                            </div>
                        </div>

                        <div className="vox-card" style={{ background: 'rgba(0, 122, 255, 0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', border: '1px dashed rgba(0, 122, 255, 0.3)' }}>
                            <Info size={32} color="#007AFF" style={{ marginBottom: '12px', opacity: 0.5 }} />
                            <p style={{ fontSize: '13px', fontWeight: '800', color: '#007AFF', margin: 0 }}>
                                Foco em Leads Quentes
                            </p>
                            <p style={{ fontSize: '11px', color: 'rgba(0, 122, 255, 0.7)', padding: '0 20px', marginTop: '4px' }}>
                                Priorize contatos realizados nas últimas 2h para aumentar sua taxa de conversão em até 35%.
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* Identificação Técnica */}
            <div style={{ textAlign: 'center', opacity: 0.3, fontSize: '10px', fontWeight: '900', letterSpacing: '2px', marginTop: 'auto' }}>
                CRM PERFORMANCE ENGINE v2.0 • IOS 26 CORE • UNID {user?.unitId || '0'}
            </div>
        </div>
    );
};

export default CommercialDashboard;
