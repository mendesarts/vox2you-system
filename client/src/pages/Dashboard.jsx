import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Store, Award, TrendingUp, DollarSign, Activity, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DashboardFilters from '../components/DashboardFilters';
import StudentsAtRiskModal from '../components/StudentsAtRiskModal';

import { ROLE_LABELS } from '../utils/roles';

const Dashboard = () => {
    const { user, selectedUnit } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [showAtRiskModal, setShowAtRiskModal] = useState(false);

    const displayName = user?.name ? user.name.split(' ').slice(0, 2).join(' ') : 'Gestor';
    const roleId = user?.roleId ? Number(user.roleId) : null;
    const roleName = ROLE_LABELS[roleId] || user?.role || 'Gestor';

    useEffect(() => {
        if (!user) return;
        const rId = Number(user.roleId);

        // Redirect operational roles to their specific dashboards
        if ([40, 41].includes(rId)) {
            navigate('/commercial');
            return;
        }
        if ([50, 51].includes(rId)) {
            navigate('/pedagogical');
            return;
        }
        if (rId === 60) {
            navigate('/secretary'); // or /financial? User said Gestão=Administrativo.
            return;
        }

        // If not redirected, we are Global/Manager [1, 10, 20, 30], so we fetch stats.
        // Or if logic fails, we stay here.
    }, [user, navigate]);

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
        const token = localStorage.getItem('token');

        // unitId comes from selectedUnit (context), which is Number or null (for all)
        let query = unitId ? `unitId=${unitId}` : '';
        if (startDate) query += `&startDate=${startDate}`;
        if (endDate) query += `&endDate=${endDate}`;

        const queryString = query ? `?${query}` : '';

        try {
            const statsRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/dashboard/main-stats${queryString}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Dashboard fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-ios-pop">

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
            </div>

            <DashboardFilters
                onFilterChange={handleFilterChange}
                loading={loading}
                user={user}
            />

            {(loading) ? (
                <div style={{ padding: '40px', fontWeight: 'bold', textAlign: 'center' }}>Sincronizando Dados...</div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                        {/* Setor Comercial */}
                        <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                                <Store size={18} color="#007AFF" />
                                <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '1px', color: '#1C1C1E' }}>COMERCIAL</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Leads</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.commercial?.leads || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Atendimentos</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.commercial?.appointments || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#34C759', marginBottom: '8px', textTransform: 'uppercase' }}>Tx Conversão</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.commercial?.conversionRate || '0%'}</h4>
                                </div>
                                <div style={{ background: 'rgba(255, 149, 0, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF9500', marginBottom: '8px', textTransform: 'uppercase' }}>Matrículas</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.commercial?.sales || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(255, 214, 10, 0.08)', padding: '16px', borderRadius: '16px', gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '9px', fontWeight: '900', color: '#FFD60A', textTransform: 'uppercase' }}>Meta Atingida</div>
                                        <div style={{ fontSize: '11px', fontWeight: '900' }}>{stats?.commercial?.sales || 0} / {stats?.commercial?.goal || 0}</div>
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: '900', marginBottom: '12px' }}>{stats?.commercial?.goalProgress || '0%'}</div>
                                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: stats?.commercial?.goalProgress || '0%', height: '100%', background: '#FFD60A', transition: 'width 1s ease-out' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Setor Financeiro */}
                        <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                                <DollarSign size={18} color="#34C759" />
                                <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '1px', color: '#1C1C1E' }}>FINANCEIRO</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#34C759', marginBottom: '8px', textTransform: 'uppercase' }}>Entradas</div>
                                    <h4 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{formatMoney(stats?.financial?.income || 0)}</h4>
                                </div>
                                <div style={{ background: 'rgba(255, 59, 48, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Custos Unidade</div>
                                    <h4 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{formatMoney(stats?.financial?.expense || 0)}</h4>
                                </div>
                                <div style={{ background: 'rgba(142, 142, 147, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px', textTransform: 'uppercase' }}>Custo/Aluno</div>
                                    <h4 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{formatMoney(stats?.financial?.costPerStudent || 0)}</h4>
                                </div>
                                <div style={{ background: 'rgba(175, 82, 222, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#AF52DE', marginBottom: '8px', textTransform: 'uppercase' }}>Coffee/Aluno</div>
                                    <h4 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{formatMoney(stats?.financial?.coffeePerStudent || 0)}</h4>
                                </div>
                                <div style={{ background: stats?.financial?.cashFlow >= 0 ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 59, 48, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.03)', gridColumn: 'span 2' }}>
                                    <div style={{ fontSize: '10px', fontWeight: '900', color: stats?.financial?.cashFlow >= 0 ? '#34C759' : '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Fluxo de Caixa (Sintético)</div>
                                    <h4 style={{ fontSize: '28px', fontWeight: '900', margin: 0, color: stats?.financial?.cashFlow >= 0 ? '#34C759' : '#FF3B30' }}>{formatMoney(stats?.financial?.cashFlow || 0)}</h4>
                                </div>
                            </div>
                        </div>

                        {/* Setor Administrativo */}
                        <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                                <FileText size={18} color="#AF52DE" />
                                <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '1px', color: '#1C1C1E' }}>ADMINISTRATIVO</h3>
                            </div>
                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#AF52DE', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Turmas</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                <div style={{ background: 'rgba(175, 82, 222, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '8px', fontWeight: '900', color: '#AF52DE', marginBottom: '8px', textTransform: 'uppercase' }}>Ativas</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.activeClasses || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '8px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Iniciadas</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.startedClasses || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(255, 59, 48, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '8px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Encerradas</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.finishedClasses || 0}</h4>
                                </div>
                            </div>

                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#AF52DE', marginTop: '20px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Taxas</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                <div style={{ background: 'rgba(255, 59, 48, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '8px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Cancelam.</div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.cancellationRate || '0.0%'}</h4>
                                </div>
                                <div style={{ background: 'rgba(255, 149, 0, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '8px', fontWeight: '900', color: '#FF9500', marginBottom: '8px', textTransform: 'uppercase' }}>Evasão</div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.evasionRate || '0.0%'}</h4>
                                </div>
                                <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '8px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Trancam.</div>
                                    <h4 style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.lockRate || '0.0%'}</h4>
                                </div>
                            </div>

                            <div style={{ marginTop: '16px', background: 'rgba(142, 142, 147, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                <div style={{ fontSize: '9px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px', textTransform: 'uppercase' }}>Contratos Pendentes</div>
                                <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.administrative?.pendingContracts || 0}</h4>
                            </div>
                        </div>

                        {/* Setor Pedagógico */}
                        <div className="vox-card-glass" style={{ padding: '24px', background: 'rgba(255,255,255,0.4)', gridColumn: '1 / -1' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
                                <TrendingUp size={18} color="#007AFF" />
                                <h3 style={{ fontSize: '13px', fontWeight: '900', margin: 0, letterSpacing: '1px', color: '#1C1C1E' }}>PEDAGÓGICO</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                                <div style={{ background: 'rgba(255, 214, 10, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#FFD60A', marginBottom: '8px', textTransform: 'uppercase' }}>Alunos Ativos</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.activeStudents || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(52, 199, 89, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#34C759', marginBottom: '8px', textTransform: 'uppercase' }}>Alunos Formados</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.graduatedStudents || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(0, 122, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#007AFF', marginBottom: '8px', textTransform: 'uppercase' }}>Mentorias</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.completedMentorships || 0}</h4>
                                </div>
                                <div style={{ background: 'rgba(88, 86, 214, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#5856D6', marginBottom: '8px', textTransform: 'uppercase' }}>Presença</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.attendanceRate || '0%'}</h4>
                                </div>
                                <div
                                    onClick={() => setShowAtRiskModal(true)}
                                    style={{
                                        background: 'rgba(255, 59, 48, 0.05)',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '2px solid transparent'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)';
                                        e.currentTarget.style.borderColor = '#FF3B30';
                                        e.currentTarget.style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.05)';
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                >
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>Alunos em Risco</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.atRisk || 0}</h4>
                                    <div style={{ fontSize: '10px', color: '#FF3B30', marginTop: '4px', fontWeight: '600' }}>Clique para ver</div>
                                </div>
                                <div style={{ background: 'rgba(255, 149, 0, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '9px', fontWeight: '900', color: '#FF9500', marginBottom: '8px', textTransform: 'uppercase' }}>Mentoria/Aluno</div>
                                    <h4 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>{stats?.pedagogical?.mentorshipRate || 0}</h4>
                                </div>
                            </div>
                        </div>

                    </div>

                    {stats?.commercial?.teamPerformance?.length > 0 && (
                        <div className="vox-card-glass" style={{ padding: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: '900', margin: 0 }}>Performance de Equipe <span style={{ color: 'var(--ios-teal)', fontSize: '14px', marginLeft: '8px' }}>TOP 5</span></h3>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '1px' }}>Resultados do Período</div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                            <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Comercial</th>
                                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Matrículas</th>
                                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Conversão</th>
                                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Reuniões</th>
                                            <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Leads</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(stats?.commercial?.teamPerformance) ? stats.commercial.teamPerformance : [])
                                            .sort((a, b) => b.sales - a.sales)
                                            .slice(0, 5)
                                            .map((con, idx) => (
                                                <tr key={con.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.02)', transition: '0.2s' }} className="hover:bg-gray-50">
                                                    <td style={{ padding: '16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '32px', height: '32px', borderRadius: '10px',
                                                                background: idx === 0 ? '#FFD60A' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(0,0,0,0.05)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '14px', fontWeight: '900', color: idx < 3 ? '#000' : '#8E8E93'
                                                            }}>
                                                                {idx + 1}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.1' }}>
                                                                <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-main)' }}>{con.name}</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>{con.role === 'Consultor' ? 'Comercial' : con.role}</span>
                                                                    <span style={{ fontSize: '10px', color: '#C7C7CC' }}>•</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--ios-teal)', textTransform: 'uppercase' }}>{con.unit || 'Matriz'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '16px' }}>
                                                        <span style={{ fontWeight: '900', fontSize: '18px', color: 'var(--ios-teal)' }}>{con.sales}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '16px' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                            <span style={{ fontWeight: '800', fontSize: '14px' }}>{con.conversionRate}%</span>
                                                            <div style={{ width: '60px', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                                <div style={{ width: `${con.conversionRate}%`, height: '100%', background: '#34C759' }}></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '16px' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#5856D6' }}>{con.meetings}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center', padding: '16px' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '15px', color: '#8E8E93' }}>{con.totalLeads}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Students At Risk Modal */}
            <StudentsAtRiskModal
                isOpen={showAtRiskModal}
                onClose={() => setShowAtRiskModal(false)}
            />
        </div>
    );
};

export default Dashboard;
