import React, { useState, useEffect } from 'react';
import { Users, Palette, Shield, Book, Sun, Moon, Plus, Trash2, Database, Download, Calendar, Building, Bot } from 'lucide-react';
import { fetchUsers, createUser, deleteUser } from '../services/api';
import CoursesSettings from './CoursesSettings';
import CalendarSettings from './administrative/CalendarSettings';
import UnitManagement from './administrative/UnitManagement';
import AITrainingSettings from './administrative/AITrainingSettings'; // Imported
import WhatsAppConnection from './administrative/WhatsAppConnection'; // Imported
import './settings.css';

import { useLocation } from 'react-router-dom';

const Settings = ({ isLightMode, toggleTheme }) => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('appearance'); // Default to first alphabetical
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'consultant', color: '#05AAA8' });

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location]);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchUsers();
            if (Array.isArray(data)) setUsers(data);
            else { console.error('Dados de usuários inválidos:', data); setUsers([]); }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await createUser(newUser);
            setNewUser({ name: '', email: '', password: '', role: 'consultant', color: '#05AAA8' });
            loadUsers();
            alert('Usuário criado com sucesso!');
        } catch (error) {
            alert('Erro ao criar usuário: ' + error.message);
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Tem certeza que deseja remover este usuário?')) {
            try {
                await deleteUser(id);
                loadUsers();
            } catch (error) {
                alert('Erro ao deletar usuário');
            }
        }
    };

    const roles = {
        admin: 'Franqueado/Admin',
        sales_leader: 'Líder Comercial',
        consultant: 'Consultor',
        admin_staff: 'Administrativo',
        pedagogical: 'Pedagógico',
    };

    return (
        <div className="settings-page page-fade-in">
            <header className="page-header">
                <div>
                    <h2 className="page-title">Configurações</h2>
                    <p className="page-subtitle">Gerenciamento de sistema e usuários.</p>
                </div>
            </header>
            <div className="settings-container">
                <aside className="settings-sidebar">
                    {/* A - Aparência */}
                    <div className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
                        <Palette size={18} /> Aparência
                    </div>
                    {/* W - WhatsApp (Prioridade) */}
                    <div className={`settings-nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`} onClick={() => setActiveTab('whatsapp')}>
                        <Bot size={18} /> Conexão WhatsApp
                    </div>
                    {/* C - Cadastro de Treinamentos */}
                    <div className={`settings-nav-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                        <Book size={18} /> Cadastro de Treinamentos
                    </div>
                    {/* C - Calendário Escolar */}
                    <div className={`settings-nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
                        <Calendar size={18} /> Calendário Escolar
                    </div>
                    {/* T - Treinamento da IA (Novo) */}
                    <div className={`settings-nav-item ${activeTab === 'ai-training' ? 'active' : ''}`} onClick={() => setActiveTab('ai-training')}>
                        <Bot size={18} /> Agentes de IA
                    </div>
                    {/* D - Dados da Unidade */}
                    <div className={`settings-nav-item ${activeTab === 'unit' ? 'active' : ''}`} onClick={() => setActiveTab('unit')}>
                        <Building size={18} /> Dados da Unidade
                    </div>
                    {/* S - Segurança */}
                    <div className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <Shield size={18} /> Segurança
                    </div>
                    {/* U - Usuários */}
                    <div className={`settings-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <Users size={18} /> Usuários e Permissões
                    </div>
                </aside>
                <main className="settings-content">
                    {activeTab === 'appearance' && (
                        <div>
                            <div className="section-title"><Palette size={24} /> Aparência do Sistema</div>
                            <div className="user-form" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ color: 'var(--text-main)', marginBottom: 4 }}>Tema do Sistema</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Alternar entre modo claro e escuro.</p>
                                </div>
                                <button onClick={toggleTheme} className="btn-primary" style={{ background: isLightMode ? '#0f172a' : '#f8fafc', color: isLightMode ? '#fff' : '#000', border: '1px solid var(--border)' }}>
                                    {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                                    <span style={{ marginLeft: 8 }}>{isLightMode ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'whatsapp' && <WhatsAppConnection />}

                    {activeTab === 'calendar' && <CalendarSettings />}

                    {activeTab === 'courses' && <CoursesSettings />}

                    {activeTab === 'ai-training' && <AITrainingSettings />}

                    {activeTab === 'unit' && <UnitManagement />}

                    {activeTab === 'security' && (
                        <div>
                            <div className="section-title"><Shield size={24} /> Segurança e Backup</div>

                            <div className="control-card" style={{ marginBottom: '20px' }}>
                                <div className="card-header" style={{ justifyContent: 'space-between' }}>
                                    <div>
                                        <h4 style={{ margin: 0, color: 'var(--text-main)' }}>Backup do Sistema</h4>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                            Realize backups manuais do banco de dados para prevenir perda de dados.
                                            O sistema também realiza backups automáticos diariamente.
                                        </p>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        onClick={async () => {
                                            try {
                                                if (!window.confirm('Iniciar backup agora?')) return;
                                                const res = await fetch('http://localhost:3000/api/admin/backup', { method: 'POST' });
                                                const data = await res.json();
                                                if (res.ok) {
                                                    alert('Backup realizado: ' + data.filename);
                                                } else {
                                                    alert('Erro: ' + data.error);
                                                }
                                            } catch (e) {
                                                alert('Erro de conexão');
                                            }
                                        }}
                                    >
                                        <Database size={16} style={{ marginRight: 8 }} /> Fazer Backup Agora
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <div className="section-title"><Users size={24} /> Gerenciar Usuários</div>
                            <form className="user-form" onSubmit={handleCreateUser}>
                                <div className="form-group"><label>Nome Completo</label><input required type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
                                <div className="form-group"><label>Email</label><input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
                                <div className="form-group"><label>Senha Inicial</label><input required type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                                <div className="form-group"><label>Função (Cargo)</label>
                                    <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                        <option value="admin">Franqueado / Admin</option>
                                        <option value="sales_leader">Líder Comercial</option>
                                        <option value="consultant">Consultor</option>
                                        <option value="admin_staff">Administrativo</option>
                                        <option value="pedagogical">Pedagógico</option>
                                    </select>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="btn-primary"><Plus size={18} /> Adicionar Usuário</button>
                                </div>
                            </form>
                            <table className="data-table">
                                <thead><tr><th>Usuário</th><th>Email</th><th>Função</th><th>Ações</th></tr></thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td><div className="student-name" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div className="avatar-sm" style={{
                                                    background: user.color || '#ccc',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    flexShrink: 0
                                                }}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                {user.name}
                                            </div></td>
                                            <td>{user.email}</td>
                                            <td><span className={`role-badge role-${user.role}`}>{roles[user.role]}</span></td>
                                            <td><button className="icon-btn-sm" onClick={() => handleDeleteUser(user.id)} title="Remover"><Trash2 size={16} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Settings;
