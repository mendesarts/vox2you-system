import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, MessageCircle, TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const StudentsAtRiskPage = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, high, medium, low
    const [summary, setSummary] = useState({ high: 0, medium: 0, low: 0 });

    useEffect(() => {
        fetchStudentsAtRisk();
    }, []);

    const fetchStudentsAtRisk = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reports/students-at-risk');
            setStudents(response.data.data || []);
            setSummary(response.data.summary || { high: 0, medium: 0, low: 0 });
        } catch (error) {
            console.error('Erro ao buscar alunos em risco:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'high': return { bg: 'rgba(255, 59, 48, 0.1)', border: '#FF3B30', text: '#FF3B30' };
            case 'medium': return { bg: 'rgba(255, 149, 0, 0.1)', border: '#FF9500', text: '#FF9500' };
            case 'low': return { bg: 'rgba(255, 214, 10, 0.1)', border: '#FFD60A', text: '#FFD60A' };
            default: return { bg: 'rgba(142, 142, 147, 0.1)', border: '#8E8E93', text: '#8E8E93' };
        }
    };

    const getRiskLabel = (level) => {
        switch (level) {
            case 'high': return 'ALTO';
            case 'medium': return 'MÉDIO';
            case 'low': return 'BAIXO';
            default: return 'DESCONHECIDO';
        }
    };

    const getFactorIcon = (type) => {
        switch (type) {
            case 'consecutive_absences': return <Calendar size={16} />;
            case 'low_attendance': return <TrendingUp size={16} />;
            case 'overdue_payments': return <DollarSign size={16} />;
            case 'payment_status': return <DollarSign size={16} />;
            default: return <AlertTriangle size={16} />;
        }
    };

    const filteredStudents = students.filter(s => {
        if (filter === 'all') return true;
        return s.riskLevel === filter;
    });

    const handleCall = (phone) => {
        window.open(`tel:${phone}`, '_self');
    };

    const handleWhatsApp = (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#8E8E93' }}>Carregando...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }} className="animate-ios-pop">

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div
                    className="vox-card-glass"
                    onClick={() => setFilter('all')}
                    style={{
                        padding: '24px',
                        background: filter === 'all' ? 'rgba(0, 122, 255, 0.1)' : 'rgba(255,255,255,0.4)',
                        border: filter === 'all' ? '2px solid #007AFF' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#8E8E93', marginBottom: '8px', textTransform: 'uppercase' }}>Total</div>
                    <h4 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#1C1C1E' }}>{students.length}</h4>
                    <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px', fontWeight: '600' }}>Alunos em risco</div>
                </div>

                <div
                    className="vox-card-glass"
                    onClick={() => setFilter('high')}
                    style={{
                        padding: '24px',
                        background: filter === 'high' ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255,255,255,0.4)',
                        border: filter === 'high' ? '2px solid #FF3B30' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#FF3B30', marginBottom: '8px', textTransform: 'uppercase' }}>🚨 Risco Alto</div>
                    <h4 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#FF3B30' }}>{summary.high}</h4>
                    <div style={{ fontSize: '11px', color: '#FF3B30', marginTop: '4px', fontWeight: '600' }}>Ação imediata</div>
                </div>

                <div
                    className="vox-card-glass"
                    onClick={() => setFilter('medium')}
                    style={{
                        padding: '24px',
                        background: filter === 'medium' ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255,255,255,0.4)',
                        border: filter === 'medium' ? '2px solid #FF9500' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#FF9500', marginBottom: '8px', textTransform: 'uppercase' }}>⚠️ Risco Médio</div>
                    <h4 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#FF9500' }}>{summary.medium}</h4>
                    <div style={{ fontSize: '11px', color: '#FF9500', marginTop: '4px', fontWeight: '600' }}>Acompanhamento</div>
                </div>

                <div
                    className="vox-card-glass"
                    onClick={() => setFilter('low')}
                    style={{
                        padding: '24px',
                        background: filter === 'low' ? 'rgba(255, 214, 10, 0.15)' : 'rgba(255,255,255,0.4)',
                        border: filter === 'low' ? '2px solid #FFD60A' : '2px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <div style={{ fontSize: '10px', fontWeight: '900', color: '#FFD60A', marginBottom: '8px', textTransform: 'uppercase' }}>ℹ️ Risco Baixo</div>
                    <h4 style={{ fontSize: '32px', fontWeight: '900', margin: 0, color: '#B8860B' }}>{summary.low}</h4>
                    <div style={{ fontSize: '11px', color: '#B8860B', marginTop: '4px', fontWeight: '600' }}>Monitoramento</div>
                </div>
            </div>

            {/* Students List */}
            {filteredStudents.length === 0 ? (
                <div className="vox-card-glass" style={{ padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>
                        Nenhum aluno em risco!
                    </h3>
                    <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '600' }}>
                        {filter === 'all'
                            ? 'Todos os alunos estão com bom desempenho.'
                            : `Nenhum aluno com risco ${getRiskLabel(filter).toLowerCase()}.`
                        }
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {filteredStudents.map((student) => {
                        const colors = getRiskColor(student.riskLevel);
                        return (
                            <div
                                key={student.id}
                                className="vox-card-glass"
                                style={{
                                    padding: '28px',
                                    background: colors.bg,
                                    border: `2px solid ${colors.border}`,
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                {/* Student Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                            <h3 style={{ fontSize: '22px', fontWeight: '900', margin: 0, color: '#1C1C1E' }}>
                                                {student.name}
                                            </h3>
                                            <span style={{
                                                padding: '6px 12px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                background: colors.bg,
                                                color: colors.text,
                                                border: `1.5px solid ${colors.border}`,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                RISCO {getRiskLabel(student.riskLevel)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '13px', color: '#3C3C43', fontWeight: '600' }}>
                                            {student.course && (
                                                <div>📚 <strong>Curso:</strong> {student.course}</div>
                                            )}
                                            {student.class && (
                                                <div>👥 <strong>Turma:</strong> {student.class}</div>
                                            )}
                                            <div>📧 <strong>E-mail:</strong> {student.email}</div>
                                            <div>📱 <strong>Telefone:</strong> {student.phone}</div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => handleCall(student.phone)}
                                            style={{
                                                padding: '12px 20px',
                                                background: '#007AFF',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '14px',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                transition: 'all 0.2s',
                                                boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            <Phone size={16} /> Ligar
                                        </button>
                                        <button
                                            onClick={() => handleWhatsApp(student.phone)}
                                            style={{
                                                padding: '12px 20px',
                                                background: '#34C759',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '14px',
                                                fontSize: '13px',
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
                                            <MessageCircle size={16} /> WhatsApp
                                        </button>
                                    </div>
                                </div>

                                {/* Risk Factors */}
                                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '20px' }}>
                                    <h4 style={{ fontSize: '13px', fontWeight: '900', color: '#1C1C1E', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Fatores de Risco ({student.totalRiskFactors})
                                    </h4>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {student.riskFactors.map((factor, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    background: factor.severity === 'high' ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 149, 0, 0.08)',
                                                    border: `1px solid ${factor.severity === 'high' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 149, 0, 0.2)'}`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px'
                                                }}
                                            >
                                                <div style={{ color: factor.severity === 'high' ? '#FF3B30' : '#FF9500' }}>
                                                    {getFactorIcon(factor.type)}
                                                </div>
                                                <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: '#1C1C1E' }}>
                                                    {factor.description}
                                                </span>
                                                {factor.severity === 'high' && (
                                                    <span style={{
                                                        padding: '4px 10px',
                                                        background: '#FF3B30',
                                                        color: 'white',
                                                        fontSize: '10px',
                                                        fontWeight: '900',
                                                        borderRadius: '8px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.5px'
                                                    }}>
                                                        URGENTE
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StudentsAtRiskPage;
