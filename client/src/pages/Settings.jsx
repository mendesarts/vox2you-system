import React, { useState, useEffect } from 'react';
import { Palette, Shield, Book, Sun, Moon, Database, Users, Building, Bot, Calendar, Activity, Camera, User } from 'lucide-react';
import CoursesSettings from './CoursesSettings';
import CalendarSettings from './administrative/CalendarSettings';
import UnitManagement from './administrative/UnitManagement';
import AITrainingSettings from './administrative/AITrainingSettings';
import WhatsAppConnection from './administrative/WhatsAppConnection';
import ChangePasswordForm from '../components/ChangePasswordForm';
import UsersPage from './UsersPage';
import SystemHealth from './admin/SystemHealth';
import { useAuth } from '../context/AuthContext';
import './settings.css';

import { useLocation, useSearchParams } from 'react-router-dom';

const Settings = ({ isLightMode, toggleTheme }) => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    // LÓGICA DE PRIORIDADE: 1. State do Router > 2. URL Query Param > 3. Padrão 'appearance'
    const initialTab = location.state?.activeTab || searchParams.get('tab') || 'appearance';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Garante que se a URL mudar, a aba muda (Sincronia)
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [searchParams]);
    const [previewImage, setPreviewImage] = useState(null);

    const LEADER_ROLES = ['master', 'director', 'franchisee', 'manager', 'diretor', 'franqueado', 'gestor', 'admin'];
    const isActiveLeader = user && LEADER_ROLES.some(r => user.role.includes(r.toLowerCase()));

    useEffect(() => {
        if (location.state?.activeTab) {
            // Map legacy 'security' redirect to new 'profile' tab
            const targetTab = location.state.activeTab === 'security' ? 'profile' : location.state.activeTab;
            setActiveTab(targetTab);
        }
    }, [location]);

    // Redirect if accessing restricted tab without permission
    useEffect(() => {
        const restrictedTabs = ['users', 'whatsapp', 'courses', 'calendar', 'ai-training', 'unit'];
        if (!isActiveLeader && restrictedTabs.includes(activeTab)) {
            setActiveTab('appearance');
        }
    }, [activeTab, isActiveLeader]);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewImage(url);
            // In a real app, we would upload this to a server
            alert('Foto de perfil atualizada com sucesso! (Simulação)');
        }
    };

    return (
        <div className="settings-page page-fade-in">
            <header className="page-header">
                <div>
                    <h2 className="page-title">Configurações</h2>
                    <p className="page-subtitle">Gerenciamento de sistema e preferências.</p>
                </div>
            </header>
            <div className="settings-container">
                <aside className="settings-sidebar">
                    <div className={`settings-nav-item ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
                        <Palette size={18} /> Aparência
                    </div>
                    {/* Access Control for Users Tab */}
                    {isActiveLeader && (
                        <>
                            <div className={`settings-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                                <Users size={18} /> Gestão Usuários
                            </div>
                            <div className={`settings-nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`} onClick={() => setActiveTab('whatsapp')}>
                                <Bot size={18} /> Conexão WhatsApp
                            </div>
                            {/* ... other tabs ... */}
                            <div className={`settings-nav-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                                <Book size={18} /> Cadastro de Treinamentos
                            </div>
                            <div className={`settings-nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
                                <Calendar size={18} /> Calendário Escolar
                            </div>
                            <div className={`settings-nav-item ${activeTab === 'ai-training' ? 'active' : ''}`} onClick={() => setActiveTab('ai-training')}>
                                <Bot size={18} /> Agentes de IA
                            </div>
                            <div className={`settings-nav-item ${activeTab === 'unit' ? 'active' : ''}`} onClick={() => setActiveTab('unit')}>
                                <Building size={18} /> Dados da Unidade
                            </div>
                        </>
                    )}
                    {user && user.role === 'master' && (
                        <div className={`settings-nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
                            <Activity size={18} /> Monitoramento
                        </div>
                    )}
                    <div className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <User size={18} /> Perfil
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
                                <button onClick={toggleTheme} style={{
                                    background: isLightMode ? '#374151' : '#f3f4f6',
                                    color: isLightMode ? '#ffffff' : '#1f2937',
                                    border: '1px solid var(--border)',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: '600',
                                    transition: 'all 0.2s'
                                }}>
                                    {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
                                    <span style={{ marginLeft: 8 }}>{isLightMode ? 'Ativar Modo Escuro' : 'Ativar Modo Claro'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && <UsersPage />}

                    {activeTab === 'whatsapp' && <WhatsAppConnection />}

                    {activeTab === 'calendar' && <CalendarSettings />}

                    {activeTab === 'courses' && <CoursesSettings />}

                    {activeTab === 'ai-training' && <AITrainingSettings />}

                    {activeTab === 'unit' && <UnitManagement />}

                    {activeTab === 'monitoring' && <SystemHealth />}

                    {activeTab === 'profile' && (
                        <div>
                            <div className="section-title"><User size={24} /> Meu Perfil</div>

                            {/* Profile Photo Section (Moved) */}
                            <div className="control-card" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{ position: 'relative' }}>
                                    <div className="avatar-xl" style={{
                                        width: '80px',
                                        height: '80px',
                                        borderRadius: '50%',
                                        background: user?.color || '#3b82f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                        color: 'white',
                                        overflow: 'hidden',
                                        border: '2px solid white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}>
                                        {(previewImage || user?.profilePicture) ? (
                                            <img
                                                src={previewImage || user.profilePicture}
                                                alt="Profile"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: 600 }}>{user?.name?.charAt(0) || 'U'}</span>
                                        )}
                                    </div>
                                    <label htmlFor="profile-upload" style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        background: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '6px',
                                        cursor: 'pointer',
                                        border: '2px solid var(--bg-surface)'
                                    }}>
                                        <Camera size={14} />
                                    </label>
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handlePhotoChange}
                                    />
                                </div>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>Foto de Perfil</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        Clique no ícone da câmera para alterar sua foto.
                                    </p>
                                </div>
                            </div>

                            <div className="section-title" style={{ marginTop: '30px' }}><Shield size={20} /> Segurança</div>
                            <div className="control-card" style={{ maxWidth: '500px' }}>
                                <ChangePasswordForm />
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Settings;
