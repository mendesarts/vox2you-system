import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, ShieldCheck, LogOut, Briefcase, BookOpen, CheckSquare } from 'lucide-react';
import './sidebar.css';
import { useAuth } from '../context/AuthContext';

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

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo">
                    <NavLink to="/dashboard" style={{ textDecoration: 'none' }}>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>VoxFlow</h1>
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
                <div className="user-profile">
                    <div className="avatar-sm" style={{ background: user?.color || '#10b981', color: '#fff', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'Usuário'}</span>
                        <span className="user-role" style={{ textTransform: 'capitalize' }}>{user?.role || 'Visitante'}</span>
                    </div>
                    <LogOut size={16} className="logout-icon" onClick={logout} title="Sair" />
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
