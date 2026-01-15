import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Save, Key, UserCircle, Settings as SettingsIcon, Book, Store, Calendar, MessageSquare, Bot, FileText, Smartphone, Users, ArrowLeft, Globe, Zap, Activity, Wallet, Lock } from 'lucide-react';

// Admin Components
import CoursesSettings from './CoursesSettings';
import UnitManagement from './administrative/UnitManagement';
import UnitRulesManager from './administrative/UnitRulesManager';
import CalendarSettings from './administrative/CalendarSettings';
import WhatsAppConnection from './administrative/WhatsAppConnection';
import MarketingIntegrations from './administrative/MarketingIntegrations';
import AITrainingSettings from './administrative/AITrainingSettings';
import UsersPage from './UsersPage';
import WhatsAppSDR from './administrative/WhatsAppSDR';
import PersonalFinance from './administrative/PersonalFinance';
import SystemHealth from './admin/SystemHealth';

const Settings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState(null);

    // Role Logic
    const roleId = Number(user?.roleId);
    // Global & Managers: 1=Master, 10=Director, 20=Franqueado, 30=Gestor
    const isGlobalOrManager = [1, 10, 20, 30].includes(roleId);

    // Admin settings generally restricted to Master/Director, sometimes Franqueado
    const isAdmin = [1, 10, 20].includes(roleId);
    const isMaster = roleId === 1;

    const [activeSection, setActiveSection] = useState('account');

    const sections = [
        { id: 'account', label: 'Minha Conta', icon: UserCircle },
        { id: 'management', label: 'Diretoria & Gestão', condition: isGlobalOrManager, icon: Shield },
        { id: 'integrations', label: 'Conectividade & IA', condition: isAdmin, icon: Zap },
        { id: 'master', label: 'Acesso Master', condition: isMaster, icon: Lock }
    ];

    const styles = {
        container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
        header: { marginBottom: '40px' },
        title: { fontSize: '32px', fontWeight: '900', color: '#1C1C1E', margin: 0, letterSpacing: '-1px' },
        subtitle: { fontSize: '16px', color: '#8E8E93', marginTop: '4px' },
        tabContainer: {
            display: 'flex',
            gap: '12px',
            background: '#F2F2F7',
            padding: '6px',
            borderRadius: '16px',
            width: 'fit-content',
            marginBottom: '32px'
        },
        tab: (active) => ({
            padding: '10px 24px',
            borderRadius: '12px',
            border: 'none',
            background: active ? '#fff' : 'transparent',
            color: active ? '#1C1C1E' : '#8E8E93',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: '0.2s'
        }),
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
        },
        card: {
            background: '#fff',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden'
        },
        cardHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
        },
        iconBox: (color) => ({
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${color}15`,
            color: color
        })
    };

    const renderCard = (id, label, description, icon, color, component) => (
        <div
            style={{
                ...styles.card,
                border: activeTab === id ? `2px solid ${color}` : styles.card.border,
                transform: activeTab === id ? 'translateY(-4px)' : 'none'
            }}
            onClick={() => setActiveTab(id)}
        >
            <div style={styles.cardHeader}>
                <div style={styles.iconBox(color)}>
                    {React.createElement(icon, { size: 24 })}
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1C1C1E' }}>{label}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#8E8E93' }}>{description}</p>
                </div>
            </div>
            {activeTab === id && (
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                </div>
            )}
        </div>
    );

    return (
        <div style={styles.container}>
            <div style={styles.tabContainer}>
                {sections.map(s => {
                    if (s.condition === false) return null;
                    return (
                        <button
                            key={s.id}
                            style={styles.tab(activeSection === s.id)}
                            onClick={() => {
                                setActiveSection(s.id);
                                setActiveTab(null); // Reset detail view when changing section
                            }}
                        >
                            <s.icon size={16} /> {s.label}
                        </button>
                    );
                })}
            </div>

            <div className="animate-ios-pop">
                {!activeTab ? (
                    <div style={styles.grid}>
                        {activeSection === 'account' && (
                            <>
                                {renderCard('profile', 'Meu Perfil', 'Dados pessoais e profissionais.', UserCircle, '#5856D6', null)}
                                {renderCard('security', 'Segurança', 'Senha e gestão de acesso.', Key, '#FF9500', null)}
                            </>
                        )}
                        {activeSection === 'management' && (
                            <>
                                {renderCard('users', 'Equipe e Permissões', 'Gerencie usuários e cargos.', Users, '#34C759', <UsersPage />)}
                                {isAdmin && renderCard('units', 'Gestão de Unidades', 'Configurações de filiais.', Store, '#007AFF', <UnitManagement />)}
                                {isAdmin && renderCard('rules', 'Regras do CRM', 'Processos e automações.', FileText, '#AF52DE', <UnitRulesManager />)}
                                {isAdmin && renderCard('calendar', 'Calendário Acadêmico', 'Recessos e feriados.', Calendar, '#FF3B30', <CalendarSettings />)}
                                {isAdmin && renderCard('courses', 'Catálogo de Cursos', 'Configuração de produtos.', Book, '#5AC8FA', <CoursesSettings />)}
                            </>
                        )}
                        {activeSection === 'integrations' && (
                            <>
                                {renderCard('marketing', 'Marketing Leads', 'Webhooks e anúncios diretos.', Globe, '#007AFF', <MarketingIntegrations />)}
                                {renderCard('whatsapp', 'WhatsApp & SDR', 'Conexão e instalação do bot.', Smartphone, '#34C759', <WhatsAppSDR />)}
                                {isAdmin && renderCard('ai', 'Inteligência Artificial', 'Treinamento da IA Julia.', Bot, '#5856D6', <AITrainingSettings />)}
                            </>
                        )}
                        {activeSection === 'master' && (
                            <>
                                {renderCard('health', 'Monitoramento Técnico', 'Status do servidor e banco de dados.', Activity, '#EC4899', <SystemHealth />)}
                                {renderCard('personal_finance', 'Gestão Pessoal', 'Controle financeiro do sócio.', Wallet, '#30B0C7', <PersonalFinance />)}
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <button
                            onClick={() => setActiveTab(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: 'none', background: 'none', color: '#007AFF', fontWeight: '700', cursor: 'pointer', padding: '0 0 12px 0' }}
                        >
                            <ArrowLeft size={18} /> Voltar para o menu
                        </button>

                        {/* Sub-Pages Content */}
                        {activeTab === 'profile' && (
                            <div className="vox-card" style={{ padding: '40px', borderRadius: '24px', background: '#fff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
                                    <div style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'linear-gradient(135deg, #5856D6, #007AFF)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: '800' }}>
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>{user?.name}</h3>
                                        <p style={{ color: '#8E8E93', margin: '4px 0 0 0' }}>{getRoleName(user?.roleId)} na {user?.unit?.name || user?.unit || 'Unidade Brasília'}</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('security')}
                                        className="btn-primary"
                                        style={{ background: '#F2F2F7', color: '#1C1C1E', border: 'none', height: '50px' }}
                                    >
                                        <Key size={18} style={{ marginRight: '8px' }} />
                                        Alterar Senha
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>

                                    {/* Personal Info */}
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93' }}>E-MAIL</label>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1E', marginTop: '4px' }}>{user?.email}</div>
                                    </div>
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93' }}>TELEFONE</label>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1E', marginTop: '4px' }}>{user?.phone || user?.whatsapp || 'Não informado'}</div>
                                    </div>

                                    {/* Professional Info */}
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93' }}>CARGO PRINCIPAL</label>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1E', marginTop: '4px' }}>{getRoleName(user?.roleId)}</div>
                                    </div>
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93' }}>UNIDADE</label>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1E', marginTop: '4px' }}>{user?.unit?.name || user?.unit || 'Unidade Principal'}</div>
                                    </div>

                                    {/* Advanced Info */}
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93' }}>ID DO USUÁRIO</label>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1E', marginTop: '4px' }}>#{user?.id}</div>
                                    </div>
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93' }}>STATUS</label>
                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#34C759', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34C759' }} />
                                            Active
                                        </div>
                                    </div>
                                </div>

                                {/* Extra Details Section */}
                                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    {/* Secondary Roles */}
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px', display: 'block' }}>ACÚMULO DE FUNÇÕES</label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {user?.secondaryRoles && Array.isArray(user.secondaryRoles) && user.secondaryRoles.map(rId => (
                                                <span key={rId} style={{ background: '#fff', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#1C1C1E' }}>
                                                    {getRoleName(rId)}
                                                </span>
                                            ))}
                                            {(!user?.secondaryRoles || user.secondaryRoles.length === 0) && <span style={{ opacity: 0.5, fontSize: '13px' }}>Nenhuma função extra</span>}
                                            {user?.canMentorship && <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>Mentoria</span>}
                                        </div>
                                    </div>

                                    {/* Working Hours Summary */}
                                    <div style={{ background: '#F2F2F7', padding: '20px', borderRadius: '16px' }}>
                                        <label style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', marginBottom: '8px', display: 'block' }}>HORÁRIO DE TRABALHO</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            {user?.workingHours ? (
                                                Object.entries(user.workingHours).map(([day, config]) => {
                                                    if (!config.active) return null;
                                                    return (
                                                        <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '2px' }}>
                                                            <strong style={{ textTransform: 'capitalize' }}>{day}</strong>
                                                            <span>{config.start} - {config.end}</span>
                                                        </div>
                                                    )
                                                })
                                            ) : (
                                                <span style={{ opacity: 0.5, fontSize: '13px' }}>Padrão Comercial</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'security' && (
                            <div className="vox-card" style={{ maxWidth: '500px', padding: '40px', borderRadius: '24px', background: '#fff' }}>
                                <h3 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '24px' }}>Alterar Senha</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <input type="password" placeholder="Senha atual" className="input-field" style={{ height: '52px' }} />
                                    <input type="password" placeholder="Nova senha" className="input-field" style={{ height: '52px' }} />
                                    <input type="password" placeholder="Repita a nova senha" className="input-field" style={{ height: '52px' }} />
                                    <button className="btn-primary" style={{ height: '56px', borderRadius: '16px' }}>Salvar Nova Senha</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'users' && isGlobalOrManager && <UsersPage />}
                        {activeTab === 'units' && isAdmin && <UnitManagement />}
                        {activeTab === 'courses' && isAdmin && <CoursesSettings />}
                        {activeTab === 'calendar' && isAdmin && <CalendarSettings />}
                        {activeTab === 'rules' && isAdmin && <UnitRulesManager />}
                        {activeTab === 'whatsapp' && isAdmin && <WhatsAppSDR />}
                        {activeTab === 'marketing' && isAdmin && <MarketingIntegrations />}
                        {activeTab === 'ai' && isMaster && <AITrainingSettings />}
                        {activeTab === 'health' && isMaster && <SystemHealth />}
                        {activeTab === 'personal_finance' && isMaster && <PersonalFinance />}
                    </div>
                )}
            </div>
        </div>
    );
};

const getRoleName = (roleId) => {
    const id = Number(roleId);
    switch (id) {
        case 1: return 'Master';
        case 10: return 'Diretor';
        case 20: return 'Franqueado';
        case 30: return 'Gerente';
        case 40: return 'Líder Comercial';
        case 41: return 'Consultor';
        case 50: return 'Líder Pedagógico';
        case 51: return 'Instrutor';
        case 60: return 'Financeiro';
        case 61: return 'Administrativo';
        default: return 'Colaborador';
    }
};

export default Settings;
