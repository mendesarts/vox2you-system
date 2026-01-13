import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import SidebarSlim from './SidebarSlim';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ROLE_LABELS } from '../utils/roles';

const GLOBAL_VIEW_ROLES = [1, 10];

const Layout = () => {
    const { user, selectedUnit, setSelectedUnit } = useAuth();
    const [units, setUnits] = useState([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchUnits = async () => {
            if (user && GLOBAL_VIEW_ROLES.includes(Number(user.roleId))) {
                try {
                    const res = await api.get('/units');
                    setUnits(res);
                } catch (error) {
                    console.error("Failed to fetch units", error);
                }
            }
        };
        fetchUnits();
    }, [user]);

    const handleUnitChange = (e) => {
        const val = e.target.value;
        setSelectedUnit(val === 'all' ? null : Number(val));
    };

    const getPageTitle = () => {
        const currentPath = location.pathname;
        const titleStyle = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' };
        const highlightStyle = { color: 'var(--ios-teal)' };

        switch (true) {
            case currentPath === '/dashboard':
                return <div style={titleStyle}>Painel de <span style={highlightStyle}>Controle</span></div>;
            case currentPath === '/crm':
                return <div style={titleStyle}>CRM <span style={highlightStyle}>Comercial</span></div>;
            case currentPath === '/secretary':
                return <div style={titleStyle}>Secretaria <span style={highlightStyle}>Escolar</span></div>;
            case currentPath.startsWith('/pedagogical'):
                return <div style={titleStyle}>Gestão <span style={highlightStyle}>Pedagógica</span></div>;
            case currentPath.startsWith('/financial'):
                return <div style={titleStyle}>Gestão <span style={highlightStyle}>Financeira</span></div>;
            case currentPath === '/calendar':
                return <div style={titleStyle}>Agenda <span style={highlightStyle}>Geral</span></div>;
            case currentPath === '/settings':
                return <div style={titleStyle}>Ajustes do <span style={highlightStyle}>Sistema</span></div>;
            case currentPath === '/users':
                return <div style={titleStyle}>Time & <span style={highlightStyle}>Acesso</span></div>;
            case currentPath === '/tasks':
                return <div style={titleStyle}>Minhas <span style={highlightStyle}>Tarefas</span></div>;
            case currentPath === '/courses':
                return <div style={titleStyle}>Gestão de <span style={highlightStyle}>Cursos</span></div>;
            case currentPath === '/marketing':
                return <div style={titleStyle}>Marketing <span style={highlightStyle}>Digital</span></div>;
            case currentPath === '/admin/health':
                return <div style={titleStyle}>Monitoramento <span style={highlightStyle}>Técnico</span></div>;
            case currentPath === '/commercial':
                return <div style={titleStyle}>Dashboard <span style={highlightStyle}>Comercial</span></div>;
            default:
                return <div style={titleStyle}>Vox<span style={highlightStyle}>2You</span></div>;
        }
    };

    const showBackButton = location.pathname !== '/dashboard' && location.pathname !== '/';

    return (
        <div className="app-layout">
            <SidebarSlim />
            <main className="main-content">
                {/* Global Unit Header */}
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 24px',
                    background: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    marginBottom: '16px'
                }}>
                    {/* Title Centered */}
                    <div style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#1e293b'
                    }}>
                        {getPageTitle()}
                    </div>

                    <div style={{ minWidth: '100px' }}>
                        {showBackButton && (
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#64748b',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <ChevronLeft size={20} />
                                Voltar
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>
                            Unidade:
                        </span>
                        {user && GLOBAL_VIEW_ROLES.includes(Number(user.roleId)) ? (
                            <select
                                value={selectedUnit || 'all'}
                                onChange={handleUnitChange}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    background: '#fff'
                                }}
                            >
                                <option value="all">Todas as Unidades</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        ) : (
                            <span style={{
                                padding: '6px 12px',
                                background: '#e2e8f0',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: '#475569'
                            }}>
                                {user?.unit || units.find(u => u.id === user?.unitId)?.name || 'Minha Unidade'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Global Greeting Subtitle */}
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 0 16px 0' }}>
                    <p style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '500', margin: 0 }}>
                        Olá, {user?.roleId ? ROLE_LABELS[user.roleId] : (user?.role || 'Usuário')} {user?.name ? user.name.split(' ').slice(0, 2).join(' ') : ''}
                    </p>
                </div>

                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
