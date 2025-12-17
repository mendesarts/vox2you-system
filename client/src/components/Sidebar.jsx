import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, ShieldCheck, LogOut, Briefcase, BookOpen, CheckSquare, Activity } from 'lucide-react';
import './sidebar.css';
import { useAuth } from '../context/AuthContext';

import logo from '../assets/logo-full-white.png';

const Sidebar = () => {
    const { user, logout } = useAuth();

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
        { icon: Briefcase, label: 'Administrativo', path: '/administrative' },
        { icon: Users, label: 'Comercial', path: '/crm' },
        { icon: BookOpen, label: 'Pedagógico', path: '/pedagogical' },
        { icon: Calendar, label: 'Calendário', path: '/calendar' },
    ];

    // Items moved to Settings
    // if (user && ['master', 'franchisee', 'manager', 'admin_financial_manager'].includes(user.role)) {
    //     navItems.push({ icon: ShieldCheck, label: 'Gestão Usuários', path: '/users' });
    // }
    // if (user && user.role === 'master') {
    //     navItems.push({ icon: Activity, label: 'Monitoramento', path: '/admin/system-status' });
    // }

    // Helper for Role Display
    const getRoleLabel = (role) => {
        const map = {
            'master': 'Master',
            'franchisee': 'Franqueado',
            'manager': 'Gerente Geral',
            'admin_financial_manager': 'Gerente Financeiro',
            'pedagogical_leader': 'Coord. Pedagógico',
            'sales_leader': 'Líder Comercial',
            'consultant': 'Consultor',
            'instructor': 'Instrutor',
            'secretary': 'Secretaria'
        };
        return map[role] || 'Colaborador';
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <NavLink to="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <img src={logo} alt="Vox2you" style={{ height: '40px', width: 'auto' }} />
                    </NavLink>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <NavLink
                    to="/settings"
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    style={{ marginBottom: '10px' }}
                >
                    <Settings size={20} />
                    <span>Configurações</span>
                </NavLink>
                <div className="user-profile" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
                    <div className="avatar-lg" style={{
                        background: user?.color || '#10b981',
                        color: '#fff',
                        width: '48px',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.2)'
                    }}>
                        {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerText = user?.name?.charAt(0) || 'U' }} />
                        ) : (
                            user?.name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="user-info" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span className="user-name" style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white' }}>{user?.name || 'Usuário'}</span>
                        <span className="user-role" style={{ fontSize: '0.8rem', opacity: 0.8, textTransform: 'none' }}>
                            {getRoleLabel(user?.role)}
                        </span>
                    </div>
                    <div style={{ width: '100%', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'center' }}>
                        <button onClick={logout} className="logout-btn" style={{ background: 'transparent', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <LogOut size={14} /> Sair do Sistema
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
