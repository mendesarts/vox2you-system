import React, { useState } from 'react';
import { Save, Building, MapPin, Phone, Mail, User } from 'lucide-react';

const UnitManagement = () => {
    // Mock initial data - In a real app, this would be fetched from an API
    const [unitInfo, setUnitInfo] = useState({
        unitName: 'Vox2You - Unidade Matriz',
        cnpj: '12.345.678/0001-90',
        address: 'Av. Paulista, 1000 - Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        phone: '(11) 3333-4444',
        email: 'contato@vox2you-matriz.com.br',
        directorName: 'Carlos Silva',
        directorEmail: 'carlos.diretor@vox2you.com.br'
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUnitInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            alert('Informações da unidade salvas com sucesso!');
        }, 1000);
        // TODO: Implement actual save logic to backend (e.g., PUT /api/admin/unit-settings)
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
            <div className="manager-header" style={{ marginBottom: '20px' }}>
                <div>
                    <h3>Gestão da Unidade</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Configurações e dados cadastrais da escola</p>
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={loading}>
                    <Save size={18} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="control-card" style={{ padding: '25px' }}>
                <form className="user-form" style={{ gridTemplateColumns: '1fr 1fr' }}>

                    <div className="section-title" style={{ gridColumn: '1 / -1', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={20} /> Dados da Empresa
                    </div>

                    <div className="form-group">
                        <label>Nome da Unidade</label>
                        <input type="text" name="unitName" value={unitInfo.unitName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>CNPJ</label>
                        <input type="text" name="cnpj" value={unitInfo.cnpj} onChange={handleChange} />
                    </div>

                    <div className="section-title" style={{ gridColumn: '1 / -1', margin: '20px 0 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={20} /> Endereço
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label>Logradouro Completo</label>
                        <input type="text" name="address" value={unitInfo.address} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Cidade</label>
                        <input type="text" name="city" value={unitInfo.city} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Estado (UF)</label>
                        <input type="text" name="state" value={unitInfo.state} onChange={handleChange} maxLength={2} />
                    </div>
                    <div className="form-group">
                        <label>CEP</label>
                        <input type="text" name="zipCode" value={unitInfo.zipCode} onChange={handleChange} />
                    </div>

                    <div className="section-title" style={{ gridColumn: '1 / -1', margin: '20px 0 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={20} /> Contato
                    </div>

                    <div className="form-group">
                        <label>Telefone Principal</label>
                        <input type="text" name="phone" value={unitInfo.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Email Corporativo</label>
                        <input type="email" name="email" value={unitInfo.email} onChange={handleChange} />
                    </div>

                    <div className="section-title" style={{ gridColumn: '1 / -1', margin: '20px 0 15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={20} /> Responsável / Direção
                    </div>

                    <div className="form-group">
                        <label>Nome do Diretor(a)</label>
                        <input type="text" name="directorName" value={unitInfo.directorName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Email do Responsável</label>
                        <input type="email" name="directorEmail" value={unitInfo.directorEmail} onChange={handleChange} />
                    </div>

                </form>
            </div>
        </div>
    );
};

export default UnitManagement;
