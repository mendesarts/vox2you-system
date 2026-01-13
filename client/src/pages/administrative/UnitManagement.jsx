import React, { useState, useEffect } from 'react';
import { Save, Building, MapPin, Phone, User, Clock, Edit2, ArrowUpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import DataCard from '../../components/DataCard';
import { VoxModal } from '../../components/VoxUI';

const UnitManagement = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const [unitInfo, setUnitInfo] = useState({
        name: '',
        cnpj: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        directorName: '',
        directorEmail: '',
        businessHours: {
            weekdays: '',
            saturday: ''
        },
        financialSettings: {
            cardFees: {
                credit: { base: 2.99, perInstallment: 1.5 },
                debit: { base: 1.2 }
            },
            advanceRate: 1.5
        }
    });

    useEffect(() => {
        if (user && user.unitId) {
            fetchUnitData();
        }
    }, [user]);

    const fetchUnitData = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units/${user.unitId}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUnitInfo(prev => ({
                    ...prev,
                    ...data,
                    businessHours: (typeof data.businessHours === 'string' ? JSON.parse(data.businessHours) : data.businessHours) || { weekdays: '', saturday: '' }
                }));
            }
        } catch (error) {
            console.error('Error fetching unit:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('hours_')) {
            const key = name.replace('hours_', '');
            setUnitInfo(prev => ({
                ...prev,
                businessHours: { ...prev.businessHours, [key]: value }
            }));
        } else if (name.startsWith('fin_')) {
            const parts = name.split('_'); // fin_cardFees_credit_base
            const field = parts[1]; // cardFees
            const sub = parts[2]; // credit
            const key = parts[3]; // base

            if (key) {
                setUnitInfo(prev => ({
                    ...prev,
                    financialSettings: {
                        ...prev.financialSettings,
                        [field]: {
                            ...prev.financialSettings[field],
                            [sub]: {
                                ...prev.financialSettings[field][sub],
                                [key]: parseFloat(value) || 0
                            }
                        }
                    }
                }));
            } else {
                // Single field like advanceRate
                setUnitInfo(prev => ({
                    ...prev,
                    financialSettings: {
                        ...prev.financialSettings,
                        [field]: parseFloat(value) || 0
                    }
                }));
            }
        } else {
            setUnitInfo(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units/${user.unitId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(unitInfo)
            });

            if (res.ok) {
                setToast({ message: 'Dados da unidade atualizados!', type: 'success' });
                setIsEditing(false);
            } else {
                setToast({ message: 'Erro ao salvar.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="unit-management page-fade-in" style={{ padding: '0 0 32px 0' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'nowrap', gap: '20px', marginBottom: '32px' }}>
                <div style={{ minWidth: 0 }}>
                    <h2 className="page-title" style={{ whiteSpace: 'nowrap' }}>Minha Unidade</h2>
                    <p className="page-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Detalhes da franquia, localização e configurações operacionais.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
                    >
                        <Edit2 size={18} /> Editar Dados
                    </button>
                </div>
            </header>

            {/* Read-Only Dashboard View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Visual Identity / Basic Info */}
                <DataCard
                    title="Identidade da Unidade"
                    subtitle="CNPJ e Razão Social"
                    status="Ativo"
                    statusColor="border-indigo-500"
                    onClick={() => setIsEditing(true)}
                >
                    <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#1C1C1E' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6' }}>
                                <Building size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Nome Fantasia</h4>
                                <span style={{ color: '#8E8E93' }}>{unitInfo.name || 'Não informado'}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#1C1C1E' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6' }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>CNPJ</span>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>CNPJ</h4>
                                <span style={{ color: '#8E8E93' }}>{unitInfo.cnpj || 'Não cadastrado'}</span>
                            </div>
                        </div>
                    </div>
                </DataCard>

                {/* Contact & Address */}
                <DataCard
                    title="Localização e Contato"
                    subtitle="Comercial e Suporte"
                    statusColor="border-indigo-200"
                >
                    <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#1C1C1E' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759', flexShrink: 0 }}>
                                <MapPin size={20} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Endereço</h4>
                                <div style={{ fontSize: '14px', color: '#8E8E93', lineHeight: 1.5 }}>
                                    {unitInfo.address || 'Endereço não informado'}<br />
                                    {unitInfo.city && `${unitInfo.city} - ${unitInfo.state}`}
                                    {unitInfo.zipCode && <div style={{ fontSize: '12px', color: '#C7C7CC', marginTop: '4px' }}>{unitInfo.zipCode}</div>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#1C1C1E' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#007AFF', flexShrink: 0 }}>
                                <Phone size={20} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Contato Oficial</h4>
                                <span style={{ color: '#8E8E93' }}>{unitInfo.phone || 'Sem telefone'}</span>
                            </div>
                        </div>
                    </div>
                </DataCard>

                {/* Financial Settings */}
                <DataCard
                    title="Configurações Financeiras"
                    subtitle="Taxas e Antecipação"
                    statusColor="border-emerald-200"
                >
                    <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#1C1C1E' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34C759', flexShrink: 0 }}>
                                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>%</span>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Taxas de Cartão</h4>
                                <ul style={{ fontSize: '12px', color: '#8E8E93', marginTop: '4px', padding: 0, listStyle: 'none' }}>
                                    <li style={{ marginBottom: '2px' }}><strong style={{ color: '#1C1C1E' }}>Crédito:</strong> {unitInfo.financialSettings?.cardFees?.credit?.base || '0'}% + {unitInfo.financialSettings?.cardFees?.credit?.perInstallment || '0'}%/parc.</li>
                                    <li><strong style={{ color: '#1C1C1E' }}>Débito:</strong> {unitInfo.financialSettings?.cardFees?.debit?.base || '0'}%</li>
                                </ul>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#1C1C1E' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5856D6', flexShrink: 0 }}>
                                <ArrowUpCircle size={18} />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Taxa Média de Antecipação</h4>
                                <span style={{ color: '#8E8E93' }}>{unitInfo.financialSettings?.advanceRate || '0'}% ao mês</span>
                            </div>
                        </div>
                    </div>
                </DataCard>
            </div>

            {/* EDIT MODAL - POPUP INSTEAD OF BOTTOM FORM */}
            <VoxModal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title="Editar Informações da Unidade"
                theme="ios"
                footer={
                    <>
                        <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancelar</button>
                        <button onClick={handleSave} className="btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </>
                }
            >
                <form id="unit-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--ios-indigo)', fontSize: '14px', margin: 0 }}>
                                <Building size={16} /> Dados Empresariais
                            </h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                            <div>
                                <label className="form-label">Nome Fantasia</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="name" value={unitInfo.name} onChange={handleChange} placeholder="Ex: Vox2You - Matriz" />
                            </div>
                            <div>
                                <label className="form-label">CNPJ</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="cnpj" value={unitInfo.cnpj || ''} onChange={handleChange} placeholder="00.000.000/0000-00" />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--ios-green)', fontSize: '14px', margin: 0 }}>
                                <MapPin size={16} /> Endereço Completo
                            </h4>
                        </div>
                        <div>
                            <label className="form-label">Logradouro</label>
                            <input className="input-field" style={{ width: '100%' }} type="text" name="address" value={unitInfo.address || ''} onChange={handleChange} placeholder="Rua, Número, Bairro" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
                            <div>
                                <label className="form-label">Cidade</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="city" value={unitInfo.city || ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Estado</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="state" value={unitInfo.state || ''} onChange={handleChange} maxLength={2} />
                            </div>
                            <div>
                                <label className="form-label">CEP</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="zipCode" value={unitInfo.zipCode || ''} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--ios-orange)', fontSize: '14px', margin: 0 }}>
                                <Clock size={16} /> Operação e Contato
                            </h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label className="form-label">Horário (Seg-Sex)</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="hours_weekdays" value={unitInfo.businessHours?.weekdays || ''} onChange={handleChange} placeholder="08:00 às 20:00" />
                            </div>
                            <div>
                                <label className="form-label">Horário (Sábados)</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="hours_saturday" value={unitInfo.businessHours?.saturday || ''} onChange={handleChange} placeholder="08:00 às 13:00" />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            <div>
                                <label className="form-label">Telefone da Unidade</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="phone" value={unitInfo.phone || ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Email Diretor</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="directorEmail" value={unitInfo.directorEmail || ''} onChange={handleChange} />
                            </div>
                            <div>
                                <label className="form-label">Nome do Diretor</label>
                                <input className="input-field" style={{ width: '100%' }} type="text" name="directorName" value={unitInfo.directorName || ''} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: 'var(--ios-indigo)', fontSize: '14px', margin: 0 }}>
                                <span style={{ fontSize: '18px' }}>%</span> Taxas Financeiras
                            </h4>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <h5 style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Cartão de Crédito</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label className="form-label">Taxa Base (%)</label>
                                        <input className="input-field" style={{ width: '100%' }} type="number" name="fin_cardFees_credit_base" value={unitInfo.financialSettings?.cardFees?.credit?.base || 0} onChange={handleChange} step="0.01" />
                                    </div>
                                    <div>
                                        <label className="form-label">Por Parcela (%)</label>
                                        <input className="input-field" style={{ width: '100%' }} type="number" name="fin_cardFees_credit_perInstallment" value={unitInfo.financialSettings?.cardFees?.credit?.perInstallment || 0} onChange={handleChange} step="0.01" />
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <h5 style={{ fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>Cartão de Débito</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div>
                                        <label className="form-label">Taxa Débito (%)</label>
                                        <input className="input-field" style={{ width: '100%' }} type="number" name="fin_cardFees_debit_base" value={unitInfo.financialSettings?.cardFees?.debit?.base || 0} onChange={handleChange} step="0.01" />
                                    </div>
                                    <div>
                                        <label className="form-label">Taxa Antecipação Média (%)</label>
                                        <input className="input-field" style={{ width: '100%' }} type="number" name="fin_advanceRate" value={unitInfo.financialSettings?.advanceRate || 0} onChange={handleChange} step="0.01" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </VoxModal>
        </div >
    );
};

export default UnitManagement;
