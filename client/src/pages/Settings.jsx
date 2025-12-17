import React, { useState, useEffect } from 'react';
import { Palette, Shield, Book, Sun, Moon, Database, Users, Building, Bot, Calendar, Activity } from 'lucide-react';
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

import { useLocation } from 'react-router-dom';

const Settings = ({ isLightMode, toggleTheme }) => {
    const location = useLocation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('appearance');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location]);

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
                    {user && ['master', 'franchisee', 'manager', 'admin_financial_manager'].includes(user.role) && (
                        <div className={`settings-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                            <Users size={18} /> Gestão Usuários
                        </div>
                    )}
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
                    {user && user.role === 'master' && (
                        <div className={`settings-nav-item ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
                            <Activity size={18} /> Monitoramento
                        </div>
                    )}
                    <div className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <Shield size={18} /> Segurança
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

                    {activeTab === 'users' && <UsersPage />}

                    {activeTab === 'whatsapp' && <WhatsAppConnection />}

                    {activeTab === 'calendar' && <CalendarSettings />}

                    {activeTab === 'courses' && <CoursesSettings />}

                    {activeTab === 'ai-training' && <AITrainingSettings />}

                    {activeTab === 'unit' && <UnitManagement />}

                    {activeTab === 'monitoring' && <SystemHealth />}

                    {activeTab === 'security' && (
                        <div>
                            <div className="section-title"><Shield size={24} /> Segurança da Conta</div>
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
