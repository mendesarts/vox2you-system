import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Camera, X, Plus, Edit, Trash2, Search, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/users.css'; // We will create this

const ROLES = {
    master: 'Diretor / Franqueadora',
    franchisee: 'Franqueado',
    manager: 'Gestor',
    sales_leader: 'Líder Comercial',
    sales: 'Comercial',
    pedagogical_leader: 'Líder Pedagógico',
    pedagogical: 'Pedagógico',
    admin_financial_manager: 'Gerente Adm/Fin',
    admin: 'Administrativo',
    financial: 'Financeiro'
};

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [successData, setSuccessData] = useState(null);

    // ... (keep useEffect/fetchData)

    // ... (keep handleImageChange)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        // Basic Validation
        if (!formData.name || !formData.email || !formData.role) {
            setFormError('Preencha os campos obrigatórios.');
            return;
        }

        // Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFormError('Email inválido.');
            return;
        }

        try {
            const passwordToSave = formData.password || 'Mudar123!';
            await api.createUser({
                ...formData,
                password: passwordToSave
            });
            setShowModal(false);
            fetchData();

            // Show Success Modal with Credentials
            setSuccessData({
                name: formData.name,
                email: formData.email,
                password: passwordToSave
            });

            // Reset form
            setFormData({
                name: '', email: '', whatsapp: '', role: 'sales', position: '', unitId: '', password: '', profilePicture: ''
            });
            setPreviewImage(null);
        } catch (error) {
            setFormError(error.message || 'Erro ao criar usuário');
        }
    };

    const handleCopyMessage = () => {
        if (!successData) return;
        const message = `
Olá, ${successData.name}!
Seu acesso ao sistema Vox2you foi criado.

🔗 Link: https://meuvoxflow.vercel.app/
📧 Login: ${successData.email}
🔑 Senha Provisória: ${successData.password}

Você será solicitado a criar uma nova senha no primeiro acesso.
        `.trim();

        navigator.clipboard.writeText(message);
        alert('Mensagem copiada para a área de transferência!');
    };

    const getAvailableRoles = () => {
        const roles = Object.entries(ROLES);
        if (currentUser.role === 'master') return roles;

        // Franchisee/Manager cannot create Master/Director
        return roles.filter(([key]) => key !== 'master');
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page-fade-in" style={{ padding: '20px' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="page-title">Gestão de Usuários</h2>
                    <p className="page-subtitle">Controle de acesso, cargos e permissões.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Novo Usuário
                </button>
            </header>

            {/* Filters */}
            <div className="search-bar" style={{ marginBottom: '20px', maxWidth: '400px', display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', padding: '10px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <Search size={20} style={{ color: 'var(--text-muted)', marginRight: '10px' }} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'transparent', padding: 0 }}
                />
            </div>

            {/* Users Grid/List */}
            <div className="users-grid">
                {filteredUsers.map(user => (
                    <div key={user.id} className="user-card animate-fade-in">
                        <div className="user-card-header">
                            <div className="user-avatar-lg">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} />
                                ) : (
                                    <div className="avatar-placeholder" style={{ backgroundColor: user.color || '#05AAA8' }}>
                                        {user.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="user-info-text">
                                <h3>{user.name}</h3>
                                <span className={`role-badge ${user.role}`}>{ROLES[user.role] || user.role}</span>
                                <p className="user-position">{user.position || 'Sem cargo definido'}</p>
                            </div>
                        </div>
                        <div className="user-card-details">
                            <div className="detail-item">
                                <Mail size={16} /> <span>{user.email}</span>
                            </div>
                            {user.whatsapp && (
                                <div className="detail-item">
                                    <Phone size={16} /> <span>{user.whatsapp}</span>
                                </div>
                            )}
                            {user.unitId && (
                                <div className="detail-item">
                                    <MapPin size={16} /> <span>Unidade: {units.find(u => u.id === user.unitId)?.name || 'N/A'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Cadastro */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>Novo Usuário</h3>
                            <button onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">

                            {/* Image Upload */}
                            <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div className="image-upload-wrapper" style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto', borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <Camera size={32} color="#94a3b8" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Clique para alterar foto</p>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Nome Completo*</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Email*</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>WhatsApp</label>
                                    <input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Cargo / Função</label>
                                    <input value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} placeholder="Ex: Consultor Sênior" />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Perfil de Acesso*</label>
                                    <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        {getAvailableRoles().map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Unidade</label>
                                    <select
                                        value={formData.unitId}
                                        onChange={e => setFormData({ ...formData, unitId: e.target.value })}
                                        disabled={currentUser.role !== 'master'} // Only master can change unit freely
                                    >
                                        <option value="">Selecione...</option>
                                        {units.map(unit => (
                                            <option key={unit.id} value={unit.id}>{unit.name}</option>
                                        ))}
                                    </select>
                                    {currentUser.role !== 'master' && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Restrito à sua unidade</p>}
                                </div>
                            </div>

                            {/* Default Password Notice */}
                            <div className="form-group">
                                <label>Senha Inicial</label>
                                <input value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Padrão: Mudar123!" />
                            </div>

                            {formError && (
                                <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}

                            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Criar Usuário</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Sucesso (Boas Vindas) */}
            {successData && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                            <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '50%', color: '#16a34a' }}>
                                <Check size={32} />
                            </div>
                        </div>
                        <h3>Usuário Criado com Sucesso!</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Envie as informações abaixo para o novo colaborador.</p>

                        <div style={{
                            background: 'var(--bg-app)',
                            padding: '20px',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'left',
                            border: '1px solid var(--border)',
                            marginBottom: '20px'
                        }}>
                            <p><strong>Olá, {successData.name}!</strong></p>
                            <p>Seu acesso ao sistema Vox2you foi criado.</p>
                            <br />
                            <p>🔗 <strong>Link:</strong> https://meuvoxflow.vercel.app/</p>
                            <p>📧 <strong>Login:</strong> {successData.email}</p>
                            <p>🔑 <strong>Senha Provisória:</strong> {successData.password}</p>
                            <br />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Você será solicitado a criar uma nova senha no primeiro acesso.</p>
                        </div>

                        <div className="modal-footer" style={{ justifyContent: 'center', gap: '15px' }}>
                            <button className="btn-secondary" onClick={() => setSuccessData(null)}>Fechar</button>
                            <button className="btn-primary" onClick={handleCopyMessage}>
                                <Check size={18} style={{ marginRight: '5px' }} /> Copiar Mensagem
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
```
