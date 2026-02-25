import React, { useState } from 'react';
import { X, User, Phone, Mail, Building, DollarSign, Save, Radio } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const QuickAddLeadModal = ({ isOpen, onClose, onSave, columnId = 'new' }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        value: '',
        channel: '',
        mobile: '',
        email: '',
        companyName: '',
        companyAddress: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        let v = value;
        if (name === 'mobile') {
            v = v.replace(/\D/g, '');
            if (v.length > 11) v = v.substring(0, 11);
            if (v.length === 11) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            else if (v.length > 6) v = v.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            else if (v.length > 2) v = v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        }
        setFormData(prev => ({ ...prev, [name]: v }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            alert('Nome é obrigatório');
            return;
        }

        try {
            setLoading(true);
            const leadData = {
                ...formData,
                phone: formData.mobile, // Map mobile to phone
                company: formData.companyName,
                address: formData.companyAddress,
                source: formData.channel || 'Orgânico',
                status: columnId,
                unitId: user?.unitId,
                responsibleId: user?.id,
                origin: 'manual_quick_add',
                createdAt: new Date()
            };

            const res = await api.post('/crm/leads', leadData);
            if (onSave) onSave(res);
            onClose();
            // Reset form
            setFormData({
                name: '',
                value: '',
                channel: '',
                mobile: '',
                email: '',
                companyName: '',
                companyAddress: ''
            });
        } catch (error) {
            console.error('Error creating lead:', error);
            alert('Erro ao criar lead');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
            <div style={{
                background: 'white', borderRadius: '12px', width: '90%', maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Adição Rápida</h2>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

                    {/* Nome */}
                    <div style={{ marginBottom: '16px' }}>
                        <input
                            name="name"
                            placeholder="Nome"
                            value={formData.name}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                            autoFocus
                        />
                    </div>

                    {/* Valor */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <DollarSign size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            name="value"
                            placeholder="Valor Estimado (R$)"
                            type="number"
                            value={formData.value}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px 12px 10px 32px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                        />
                    </div>

                    {/* Canal */}
                    <div style={{ marginBottom: '16px', position: 'relative' }}>
                        <Radio size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                        <select
                            name="channel"
                            value={formData.channel}
                            onChange={handleChange}
                            style={{
                                width: '100%', padding: '10px 12px 10px 32px', borderRadius: '6px',
                                border: '1px solid #e5e7eb', fontSize: '14px', appearance: 'none',
                                background: 'white url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 fill=%27%239ca3af%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z%27/%3E%3C/svg%3E") no-repeat right 12px center',
                                color: formData.channel ? '#1f2937' : '#9ca3af'
                            }}
                        >
                            <option value="" disabled>Canal do Lead</option>
                            <option value="Orgânico">Orgânico</option>
                            <option value="Indicação">Indicação</option>
                            <option value="Instagram">Instagram</option>
                            <option value="Facebook">Facebook</option>
                            <option value="Google">Google Ads</option>
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Telefone">Telefone</option>
                            <option value="Site">Site</option>
                            <option value="Evento">Evento</option>
                            <option value="Outro">Outro</option>
                        </select>
                    </div>

                    <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: '600' }}>CONTATO</div>

                        {/* Celular */}
                        <div style={{ marginBottom: '8px', position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                name="mobile"
                                placeholder="Telefone / Celular"
                                value={formData.mobile}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                            />
                        </div>

                        {/* Email */}
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                name="email"
                                placeholder="E-mail"
                                value={formData.email}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <div style={{ border: '1px solid #f3f4f6', borderRadius: '8px', padding: '12px', marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: '600' }}>EMPRESA</div>

                        {/* Mobile */}
                        <div style={{ marginBottom: '8px', position: 'relative' }}>
                            <Building size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input
                                name="companyName"
                                placeholder="Nome da Empresa"
                                value={formData.companyName}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                            />
                        </div>

                        {/* Endereço */}
                        <div>
                            <input
                                name="companyAddress"
                                placeholder="Endereço da Empresa"
                                value={formData.companyAddress}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            {loading ? 'Salvando...' : <><Save size={18} /> Adicionar</>}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '12px 20px',
                                background: 'white',
                                color: '#6b7280',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default QuickAddLeadModal;
