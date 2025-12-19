import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Phone, MapPin, Shield, Camera, X, Plus, Edit, Trash2, Search, Check, AlertCircle, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/users.css';

const ROLES = {
    master: 'Master',
    director: 'Diretor',
    franchisee: 'Franqueado',
    manager: 'Gestor',
    pedagogical_leader: 'Líder Pedagógico',
    sales_leader: 'Líder Comercial',
    sales: 'Consultor Comercial',
    pedagogical: 'Professor / Pedagógico',
    admin: 'Administrativo e Financeiro'
};

const GLOBAL_VIEW_ROLES = ['master', 'director', 'diretor', 'franqueadora'];

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('all'); // Unit Filter
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const ROLE_TRANSLATIONS = {
        'master': 'Master',
        'director': 'Diretor',
        'diretor': 'Diretor',
        'franchisee': 'Franqueado',
        'franqueado': 'Franqueado',
        'manager': 'Gestor',
        'gestor': 'Gestor',
        'sales': 'Consultor',
        'consultor': 'Consultor',
        'sales_leader': 'Líder Comercial',
        'admin': 'Administrativo',
        'pedagogical_leader': 'Coord. Pedagógico',
        'instructor': 'Instrutor',
        'secretary': 'Secretaria'
    };

    // Default Password Logic: V@x2you!
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: 'V@x2you!',
        role: 'sales',
        unitId: '',
        whatsapp: '',
        position: '',
        patent: '',
        unitName: '',
        profilePicture: ''
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [formError, setFormError] = useState('');
    const [successData, setSuccessData] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let result = users;

        // Search Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            );
        }

        // Unit Filter (Global Roles Only)
        if (GLOBAL_VIEW_ROLES.includes(currentUser.role) && selectedUnit !== 'all') {
            result = result.filter(u => {
                // Check both ID and Name/Tag possibilities
                return u.unitId === selectedUnit || u.unitName === selectedUnit || (units.find(unit => unit.id === u.unitId)?.name === selectedUnit);
            });
        }

        setFilteredUsers(result);
    }, [searchTerm, users, selectedUnit, currentUser.role, units]);

    const loadData = async () => {
        try {
            const [usersData, unitsData] = await Promise.all([
                api.fetchUsers(),
                api.fetchUnits ? api.fetchUnits() : Promise.resolve([])
            ]);
            const safeUnits = unitsData && Array.isArray(unitsData) ? unitsData : [];
            setUnits(safeUnits);
            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const getAvailableRoles = () => {
        const roles = Object.entries(ROLES);
        if (currentUser.role === 'master') return roles;
        if (['franchisee', 'manager'].includes(currentUser.role)) {
            return roles.filter(([key]) => !['master', 'franchisee', 'manager', 'director'].includes(key));
        }
        return [];
    };

    const formatPhone = (v) => {
        v = v.replace(/\D/g, "");
        if (v.length > 11) v = v.slice(0, 11);
        return v.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const MAX_HEIGHT = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress and convert to JPEG
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                    setPreviewImage(dataUrl);
                    setFormData(prev => ({ ...prev, profilePicture: dataUrl }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        try {
            // Validate Unit Format
            const unitNameToCheck = formData.unitName || units.find(u => u.id === formData.unitId)?.name;
            if (GLOBAL_VIEW_ROLES.includes(currentUser.role) && unitNameToCheck) {
                // Modified regex to support accents (Latin characters)
                const unitRegex = /^[a-zA-ZÀ-ÿ0-9]+\.[a-zA-ZÀ-ÿ0-9-]+$/;
                if (!unitRegex.test(unitNameToCheck)) {
                    setFormError('Formato de Unidade inválido. Use Cidade.Nome (ex: Brasília.Águas-Claras), sem espaços.');
                    return;
                }
            }

            if (isEditing) {
                const res = await fetch(`${api.API_URL || 'https://vox2you-system-978034491078.us-central1.run.app/api'}/users/${formData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Falha ao atualizar usuário');
                }
            } else {
                const newUser = await api.createUser(formData);
                setSuccessData({ ...newUser, password: formData.password });
            }

            setShowModal(false);
            resetForm();
            loadData();
        } catch (error) {
            setFormError(error.message || 'Erro ao salvar usuário.');
        }
    };


    const handleEditUser = (user) => {
        setFormData({ ...user, password: '' });
        setPreviewImage(user.profilePicture);
        setIsEditing(true);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: 'V@x2you!',
            role: 'sales',
            unitId: !GLOBAL_VIEW_ROLES.includes(currentUser.role) ? currentUser.unitId : '',
            unitName: !GLOBAL_VIEW_ROLES.includes(currentUser.role) ? currentUser.unitName : '', // Maintain name if available
            whatsapp: '',
            patent: '',
            profilePicture: ''
        });
        setPreviewImage(null);
        setIsEditing(false);
    };

    const handleCopyMessage = () => {
        if (!successData) return;
        const msg = `Olá, ${successData.name}!\nSeu acesso ao sistema Vox2you foi criado.\n\n🔗 Link: https://meuvoxflow.vercel.app/\n📧 Login: ${successData.email}\n🔑 Senha Provisória: ${successData.password}\n\nVocê será solicitado a criar uma nova senha no primeiro acesso.`;
        navigator.clipboard.writeText(msg);
        alert('Mensagem copiada!');
    };

    const canCreateUsers = ['master', 'director', 'franchisee', 'manager'].includes(currentUser.role);

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            await fetch(`${api.API_URL || 'https://vox2you-system-978034491078.us-central1.run.app/api'}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir usuário.');
        }
    };

    return (
        <div className="page-fade-in" style={{ padding: '20px' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="page-title">Gestão de Usuários</h2>
                    <p className="page-subtitle">Controle de acesso, cargos e permissões.</p>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Unit Filter for Master/Director */}
                    {GLOBAL_VIEW_ROLES.includes(currentUser.role) && (
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                fontSize: '0.9rem',
                                background: 'var(--bg-surface)',
                                color: 'var(--text-main)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="all">Todas as Unidades</option>
                            {[...new Set(users.map(u => u.unitName || units.find(unit => unit.id === u.unitId)?.name).filter(Boolean))].map(uName => (
                                <option key={uName} value={uName}>{uName}</option>
                            ))}
                        </select>
                    )}

                    {canCreateUsers && (
                        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                            <Plus size={20} /> Novo Usuário
                        </button>
                    )}
                </div>
            </header>

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

            <div className="users-grid">
                {filteredUsers.map(user => (
                    <div
                        key={user.id}
                        className="user-card animate-fade-in"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '16px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            marginBottom: '10px',
                            border: '1px solid #f3f4f6'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {/* Avatar */}
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: '#e0e7ff', color: '#4338ca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.125rem', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0
                            }}>
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    (user.name || 'U').charAt(0).toUpperCase()
                                )}
                            </div>

                            {/* Info */}
                            <div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827', margin: 0, lineHeight: 1.25 }}>{user.name}</h3>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '4px 0 8px 0' }}>{user.email}</p>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                    {/* Role Badge */}
                                    <span style={{
                                        padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em',
                                        backgroundColor: ['master', 'director', 'diretor', 'franqueadora'].includes(user.role) ? '#f3e8ff' : (user.role === 'manager' || user.role === 'gestor') ? '#dbeafe' : '#f3f4f6',
                                        color: ['master', 'director', 'diretor', 'franqueadora'].includes(user.role) ? '#7e22ce' : (user.role === 'manager' || user.role === 'gestor') ? '#1d4ed8' : '#4b5563',
                                        border: `1px solid ${['master', 'director', 'diretor', 'franqueadora'].includes(user.role) ? '#e9d5ff' : (user.role === 'manager' || user.role === 'gestor') ? '#bfdbfe' : '#e5e7eb'}`
                                    }}>
                                        {ROLE_TRANSLATIONS[user.role] || user.role}
                                    </span>

                                    {/* Unit Badge */}
                                    <span style={{
                                        display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 500, color: '#4b5563',
                                        backgroundColor: '#f9fafb', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e5e7eb'
                                    }}>
                                        <MapPin size={12} className="text-gray-400" />
                                        {user.unitName || user.unit || units.find(u => u.id === user.unitId)?.name || "Sem Unidade"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => handleEditUser(user)}
                                style={{ padding: '8px', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%', transition: 'all 0.2s' }}
                                title="Editar"
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#4f46e5'; e.currentTarget.style.background = '#eef2ff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Edit size={20} />
                            </button>
                            <button
                                onClick={() => handleDeleteUser(user.id)}
                                style={{ padding: '8px', color: '#9ca3af', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: '50%', transition: 'all 0.2s' }}
                                title="Excluir"
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#fef2f2'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; e.currentTarget.style.background = 'transparent'; }}
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h3>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">

                            {/* Foto 3x4 Style Placeholder */}
                            <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 500 }}>Foto de Perfil</label>
                                <div
                                    className="image-upload-wrapper"
                                    onClick={() => document.getElementById('fileInput').click()}
                                    style={{
                                        position: 'relative',
                                        width: '100px',
                                        height: '133px', // 3x4 aspect ratio approximately
                                        margin: '0 auto',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: '#f1f5f9',
                                        border: '2px dashed #cbd5e1',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                                >
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                                            <UserIcon size={48} />
                                            <p style={{ fontSize: '0.65rem', margin: 0 }}>Adicionar</p>
                                        </div>
                                    )}

                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: 0, transition: 'opacity 0.2s'
                                    }}
                                        className="upload-overlay"
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                    >
                                        <Edit size={24} color="#fff" />
                                    </div>
                                </div>
                                <input
                                    id="fileInput"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            {/* Campos Simplificados e Novos Campos */}
                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Nome Completo*</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Email*</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={isEditing && currentUser.role !== 'master'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>WhatsApp</label>
                                    <input
                                        placeholder="(99) 99999-9999"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                                        maxLength={15}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Patente (Gamification)</label>
                                    <input placeholder="Ex: General, Soldado..." value={formData.patent} onChange={e => setFormData({ ...formData, patent: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Unidade*</label>
                                    {GLOBAL_VIEW_ROLES.includes(currentUser.role) ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <input
                                                type="text"
                                                placeholder="Ex: Brasília.ÁguasClaras" // Updated placeholder
                                                value={formData.unitName || (formData.unitId ? units.find(u => u.id === formData.unitId)?.name : '')}
                                                onChange={e => setFormData({ ...formData, unitName: e.target.value, unitId: null })}
                                                required={!formData.unitId}
                                            />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.7em' }}>Obrigatório: Cidade.Nome (sem espaços)</small>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={currentUser.unitName || units.find(u => u.id === currentUser.unitId)?.name || 'Minha Unidade'}
                                            disabled
                                            readOnly
                                            style={{ background: 'var(--bg-app)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                        />
                                    )}
                                </div>
                            </div>


                            <div className="form-group">
                                <label>Nível de Acesso*</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    disabled={isEditing && currentUser.role !== 'master'}
                                >
                                    {getAvailableRoles().map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>{isEditing ? 'Nova Senha (opcional)' : 'Senha Inicial (Padrão: V@x2you!)'}</label>
                                <input
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={isEditing ? '******' : 'V@x2you!'}
                                    type="password"
                                />
                            </div>

                            {formError && (
                                <div className="error-message" style={{ color: '#ef4444', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <AlertCircle size={16} /> {formError}
                                </div>
                            )}

                            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">{isEditing ? 'Salvar Alterações' : 'Criar Usuário'}</button>
                            </div>
                        </form>
                    </div>
                </div >
            )}

            {
                successData && (
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
                )
            }
        </div >
    );
};

export default UsersPage;
