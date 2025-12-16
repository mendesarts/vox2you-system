import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Camera, X, Plus, Edit, Trash2, Search, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import '../styles/users.css'; // We will create this

const ROLES = {
    master: 'Diretor',
    franchisee: 'Franqueado',
    manager: 'Gestor',
    sales_leader: 'Líder Comercial',
    sales: 'Consultor Comercial',
    pedagogical_leader: 'Líder Pedagógico',
    pedagogical: 'Professor / Pedagógico',
    admin_financial_manager: 'Líder Administrativo / Financeiro',
    admin: 'Assistente Administrativo',
    financial: 'Assistente Financeiro'
};

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [successData, setSuccessData] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        role: 'sales',
        position: '',
        unitId: '',
        password: '', // Should be generated or set
        profilePicture: ''
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, unitsData] = await Promise.all([
                api.fetchUsers(),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units`).then(res => res.ok ? res.json() : [])
            ]);
            setUsers(usersData);
            setUnits(unitsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setFormError('Imagem muito grande. Máximo 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                // Resize image to max 200x200
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 200;
                    const MAX_HEIGHT = 200;
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
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    setPreviewImage(dataUrl);
                    setFormData(prev => ({ ...prev, profilePicture: dataUrl }));
                };
            };
            reader.readAsDataURL(file);
        }
    };

    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const handleEditUser = (user) => {
        setFormData({
            name: user.name,
            email: user.email,
            whatsapp: user.whatsapp || '',
            role: user.role,
            position: user.position || '',
            unitId: user.unitId || '',
            password: '', // Password empty means "don't change"
            profilePicture: user.profilePicture || ''
        });
        setPreviewImage(user.profilePicture || null);
        setIsEditing(true);
        setEditId(user.id);
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '', email: '', whatsapp: '', role: 'sales', position: '', unitId: '', password: '', profilePicture: ''
        });
        setPreviewImage(null);
        setIsEditing(false);
        setEditId(null);
        setFormError('');
    };

    const handleOpenCreate = () => {
        resetForm();
        setShowModal(true);
    };

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
            if (isEditing) {
                // Update User
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password; // Don't send empty password

                // Use the update API (assuming it's implemented as PUT /users/:id)
                // We need to fetch/api call manually or add to services/api.js, assuming api.updateUser exists or we just fetch
                // api.js was refactored, let's assume api.updateUser or use fetch directly if missing.
                // The user previously edited api.js to consolidate. I'll assume it handles put.
                // If not, I'll use fetch here to be safe and quick.

                const token = currentUser.token || localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/users/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updateData)
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Erro ao atualizar usuário');
                }

                alert('Usuário atualizado com sucesso!');
                setShowModal(false);
                fetchData();
                resetForm();

            } else {
                // Create User
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

                resetForm(); // Note: resetForm clears form but SuccessModal is separate state
            }
        } catch (error) {
            setFormError(error.message || 'Erro ao salvar usuário');
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

    const canCreateUsers = ['master', 'franchisee', 'manager'].includes(currentUser.role);

    return (
        <div className="page-fade-in" style={{ padding: '20px' }}>
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h2 className="page-title">Gestão de Usuários</h2>
                    <p className="page-subtitle">Controle de acesso, cargos e permissões.</p>
                </div>
                {canCreateUsers && (
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={20} /> Novo Usuário
                    </button>
                )}
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
                            <h3>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                            <button onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-body">

                            {/* Image Upload - Explicit UI */}
                            <div className="form-group" style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-main)', fontWeight: 500 }}>Foto de Perfil</label>
                                <div
                                    className="image-upload-wrapper"
                                    onClick={() => document.getElementById('fileInput').click()}
                                    style={{
                                        position: 'relative',
                                        width: '120px',
                                        height: '120px',
                                        margin: '0 auto',
                                        borderRadius: '50%',
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
                                            <Camera size={32} />
                                            <p style={{ fontSize: '0.7rem', margin: 0 }}>Adicionar</p>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
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
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                                    {isEditing ? 'Clique na imagem para alterar' : 'Clique para adicionar foto'}
                                </p>
                            </div>

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
                                        disabled={isEditing && currentUser.role !== 'master'} // Only master can change email on edit, or maybe stricter?
                                    />
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
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        disabled={isEditing && currentUser.role !== 'master'} // Prevent privilege change on edit unless master
                                    >
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
                                        disabled={currentUser.role !== 'master' || (isEditing && currentUser.role !== 'master')} // Only master can change unit freely
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
                                <label>{isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}</label>
                                <input
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={isEditing ? '******' : 'Padrão: Mudar123!'}
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
