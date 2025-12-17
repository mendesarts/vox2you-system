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

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

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
        if (searchTerm === '') {
            setFilteredUsers(users);
        } else {
            const lower = searchTerm.toLowerCase();
            setFilteredUsers(users.filter(u =>
                u.name.toLowerCase().includes(lower) ||
                u.email.toLowerCase().includes(lower)
            ));
        }
    }, [searchTerm, users]);

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
            unitId: !['master', 'director'].includes(currentUser.role) ? currentUser.unitId : '',
            whatsapp: '',
            position: '',
            patent: '',
            unitName: '',
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

    return (
        <div className="page-fade-in" style={{ padding: '20px' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="page-title">Gestão de Usuários</h2>
                    <p className="page-subtitle">Controle de acesso, cargos e permissões.</p>
                </div>
                {canCreateUsers && (
                    <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={20} /> Novo Usuário
                    </button>
                )}
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
                    <div key={user.id} className="user-card animate-fade-in" style={{ position: 'relative' }}>
                        <div className="user-card-actions" style={{ position: 'absolute', top: '15px', right: '15px' }}>
                            <button
                                onClick={() => handleEditUser(user)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                title="Editar Usuário"
                            >
                                <Edit size={18} />
                            </button>
                        </div>

                        <div className="user-card-header">
                            <div className="user-avatar-lg">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                ) : (
                                    <div className="avatar-placeholder" style={{ backgroundColor: user.color || '#e2e8f0', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                                        <UserIcon size={32} color="#94a3b8" />
                                    </div>
                                )}
                            </div>
                            <div className="user-info-text">
                                <h3>{user.name}</h3>
                                <span className={`role-badge ${user.role}`}>{ROLES[user.role] || user.role}</span>
                                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                                    {user.patent && <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>{user.patent}</span>}
                                    <p className="user-position" style={{ margin: 0 }}>{user.position || 'Sem cargo'}</p>
                                </div>
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
                                    <MapPin size={16} /> <span>{units.find(u => u.id === user.unitId)?.name || 'Unidade não encontrada'}</span>
                                </div>
                            )}
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
                                    <label>Cargo / Função</label>
                                    <input placeholder="Ex: Consultor Sênior" value={formData.position} onChange={e => setFormData({ ...formData, position: e.target.value })} />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Unidade*</label>
                                    {['master', 'director'].includes(currentUser.role) ? (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <input
                                                type="text"
                                                placeholder="Ex: Brasília.ÁguasClaras"
                                                value={formData.unitName || (formData.unitId ? units.find(u => u.id === formData.unitId)?.name : '')}
                                                onChange={e => setFormData({ ...formData, unitName: e.target.value, unitId: null })}
                                                required={!formData.unitId}
                                            />
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.7em' }}>Digite Cidade.Bairro para criar/vincular.</small>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={units.find(u => u.id === currentUser.unitId)?.name || 'Minha Unidade'}
                                            disabled
                                            style={{ background: 'var(--bg-app)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Perfil de Acesso*</label>
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
