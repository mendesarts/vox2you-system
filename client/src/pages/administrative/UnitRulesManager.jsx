import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, Users, ShieldAlert, CreditCard, Save, Plus, Trash2, Percent } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const UnitRulesManager = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [collaborators, setCollaborators] = useState([]);
    const [config, setConfig] = useState({
        commercialGoals: {
            unit: { sessions: 0, calls: 0, connections: 0, enrollments: 0, revenue: 0 },
            collaborators: {}
        },
        pedagogicalRules: {
            consecutiveAbsencesLimit: 2,
            totalAbsencesLimit: 5,
            mentorshipGoal: 0
        },
        financialRules: {
            paymentMethods: []
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.config) setConfig(data.config);
                if (data.collaborators) setCollaborators(data.collaborators);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units/config`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });
            if (res.ok) {
                setToast({ message: 'Configurações salvas com sucesso!', type: 'success' });
            } else {
                setToast({ message: 'Erro ao salvar configurações.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const updateCommercialGoal = (type, field, value, userId = null) => {
        const newConfig = { ...config };
        if (type === 'unit') {
            newConfig.commercialGoals.unit[field] = parseFloat(value) || 0;
        } else if (userId) {
            if (!newConfig.commercialGoals.collaborators[userId]) {
                newConfig.commercialGoals.collaborators[userId] = { sessions: 0, calls: 0, connections: 0, enrollments: 0, revenue: 0 };
            }
            newConfig.commercialGoals.collaborators[userId][field] = parseFloat(value) || 0;
        }
        setConfig(newConfig);
    };

    const addPaymentMethod = () => {
        const newConfig = { ...config };
        newConfig.financialRules.paymentMethods.push({
            name: "Nova Máquina",
            debitFee: 0,
            creditFee: 0,
            installmentFee: 0,
            anticipationRate: 0
        });
        setConfig(newConfig);
    };

    const removePaymentMethod = (index) => {
        const newConfig = { ...config };
        newConfig.financialRules.paymentMethods.splice(index, 1);
        setConfig(newConfig);
    };

    const updatePaymentMethod = (index, field, value) => {
        const newConfig = { ...config };
        newConfig.financialRules.paymentMethods[index][field] = field === 'name' ? value : parseFloat(value) || 0;
        setConfig(newConfig);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando configurações da unidade...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '32px' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1C1C1E', margin: 0 }}>Regras e Metas da Unidade</h3>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginTop: '4px' }}>Personalize os parâmetros de operação da sua unidade.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary"
                    style={{ height: '44px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>

            {/* COMERCIAL */}
            <section style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <div style={{ background: '#FFF8E1', padding: '16px 24px', borderBottom: '1px solid rgba(255, 160, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Target size={20} color="#F57C00" />
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#E65100' }}>Metas Comerciais</h4>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {/* Unit Goals */}
                    <div>
                        <h5 style={{ fontSize: '14px', fontWeight: '800', color: '#1C1C1E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={16} /> Meta Global da Unidade
                        </h5>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
                            {['sessions', 'calls', 'connections', 'enrollments', 'revenue'].map(field => (
                                <div key={field}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        {field === 'sessions' ? 'Reuniões' :
                                            field === 'calls' ? 'Ligações' :
                                                field === 'connections' ? 'Conexões' :
                                                    field === 'enrollments' ? 'Matrículas' : 'Faturamento'}
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100%', textAlign: 'center' }}
                                        value={config.commercialGoals.unit[field]}
                                        onChange={e => updateCommercialGoal('unit', field, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Collaborator Goals */}
                    <div>
                        <h5 style={{ fontSize: '14px', fontWeight: '800', color: '#1C1C1E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} /> Metas por Colaborador
                        </h5>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                                <thead>
                                    <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #E5E5EA' }}>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'left' }}>Colaborador</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'center' }}>Reuniões</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'center' }}>Ligações</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'center' }}>Conexões</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'center' }}>Matrículas</th>
                                        <th style={{ padding: '12px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'center' }}>Faturamento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collaborators.map(c => {
                                        const goals = config.commercialGoals.collaborators[c.id] || { sessions: 0, calls: 0, connections: 0, enrollments: 0, revenue: 0 };
                                        return (
                                            <tr key={c.id} style={{ borderBottom: '1px solid #E5E5EA' }}>
                                                <td style={{ padding: '12px', fontWeight: '600', color: '#1C1C1E', fontSize: '13px' }}>{c.name}</td>
                                                {['sessions', 'calls', 'connections', 'enrollments', 'revenue'].map(field => (
                                                    <td key={field} style={{ padding: '8px' }}>
                                                        <input
                                                            type="number"
                                                            className="input-field"
                                                            style={{ width: '100%', textAlign: 'center', padding: '8px 4px', fontSize: '13px' }}
                                                            value={goals[field]}
                                                            onChange={e => updateCommercialGoal('user', field, e.target.value, c.id)}
                                                        />
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* PEDAGÓGICO */}
            <section style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <div style={{ background: '#E8EAF6', padding: '16px 24px', borderBottom: '1px solid rgba(63, 81, 181, 0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ShieldAlert size={20} color="#3F51B5" />
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#283593' }}>Regras e Alertas Pedagógicos</h4>
                </div>
                <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1C1C1E', marginBottom: '8px' }}>Faltas Consecutivas para Risco</label>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '12px', lineHeight: 1.4 }}>Define o alerta automático de "Aluno em Risco" no sistema.</p>
                        <input
                            type="number" className="input-field" style={{ width: '100%' }}
                            value={config.pedagogicalRules.consecutiveAbsencesLimit}
                            onChange={e => setConfig({ ...config, pedagogicalRules: { ...config.pedagogicalRules, consecutiveAbsencesLimit: parseInt(e.target.value) || 0 } })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1C1C1E', marginBottom: '8px' }}>Faltas Totais (no módulo ou curso)</label>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '12px', lineHeight: 1.4 }}>Alerta secundário de risco por volume total de absenteísmo.</p>
                        <input
                            type="number" className="input-field" style={{ width: '100%' }}
                            value={config.pedagogicalRules.totalAbsencesLimit}
                            onChange={e => setConfig({ ...config, pedagogicalRules: { ...config.pedagogicalRules, totalAbsencesLimit: parseInt(e.target.value) || 0 } })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#1C1C1E', marginBottom: '8px' }}>Meta de Mentorias Mensais</label>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '12px', lineHeight: 1.4 }}>Volume de mentorias esperado para a equipe pedagógica.</p>
                        <input
                            type="number" className="input-field" style={{ width: '100%' }}
                            value={config.pedagogicalRules.mentorshipGoal}
                            onChange={e => setConfig({ ...config, pedagogicalRules: { ...config.pedagogicalRules, mentorshipGoal: parseInt(e.target.value) || 0 } })}
                        />
                    </div>
                </div>
            </section>

            {/* FINANCEIRO */}
            <section style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <div style={{ background: '#E8F5E9', padding: '16px 24px', borderBottom: '1px solid rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <CreditCard size={20} color="#2E7D32" />
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#1B5E20' }}>Taxas e Maquininhas de Cartão</h4>
                    </div>
                    <button
                        onClick={addPaymentMethod}
                        className="btn-primary"
                        style={{ background: '#2E7D32', borderColor: '#2E7D32', fontSize: '12px', height: '32px', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <Plus size={14} /> Adicionar Máquina
                    </button>
                </div>
                <div style={{ padding: '24px' }}>
                    {config.financialRules.paymentMethods.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#8E8E93', fontStyle: 'italic', fontSize: '14px' }}>Nenhuma forma de pagamento configurada.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                            {config.financialRules.paymentMethods.map((pm, idx) => (
                                <div key={idx} style={{ padding: '20px', borderRadius: '12px', background: '#F9F9F9', border: '1px solid #E5E5EA', position: 'relative' }}>

                                    <button
                                        onClick={() => removePaymentMethod(idx)}
                                        style={{
                                            position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none',
                                            color: '#FF3B30', cursor: 'pointer', opacity: 0.7, padding: '4px'
                                        }}
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div style={{ marginBottom: '16px', paddingRight: '30px' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px' }}>Nome / Identificação</label>
                                        <input
                                            type="text" className="input-field" style={{ width: '100%', fontWeight: '700' }}
                                            value={pm.name} onChange={e => updatePaymentMethod(idx, 'name', e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                Débito <Percent size={10} />
                                            </label>
                                            <input
                                                type="number" step="0.01" className="input-field" style={{ width: '100%' }}
                                                value={pm.debitFee} onChange={e => updatePaymentMethod(idx, 'debitFee', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                Crédito (1x) <Percent size={10} />
                                            </label>
                                            <input
                                                type="number" step="0.01" className="input-field" style={{ width: '100%' }}
                                                value={pm.creditFee} onChange={e => updatePaymentMethod(idx, 'creditFee', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                Parcelamento <Percent size={10} />
                                            </label>
                                            <input
                                                type="number" step="0.01" className="input-field" style={{ width: '100%' }}
                                                value={pm.installmentFee} onChange={e => updatePaymentMethod(idx, 'installmentFee', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                Antecipação <Percent size={10} />
                                            </label>
                                            <input
                                                type="number" step="0.01" className="input-field" style={{ width: '100%' }}
                                                value={pm.anticipationRate} onChange={e => updatePaymentMethod(idx, 'anticipationRate', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default UnitRulesManager;
