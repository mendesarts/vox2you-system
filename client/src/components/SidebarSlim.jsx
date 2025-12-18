import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, LogOut, Briefcase, BookOpen, CheckSquare, Menu, X } from 'lucide-react';
import './sidebar.css';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-full-white.png';

const SidebarSlim = () => {
    const { user, logout } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const closeMobile = () => setIsMobileOpen(false);

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
        { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
        { icon: Briefcase, label: 'Administrativo', path: '/administrative' },
        { icon: Users, label: 'Comercial', path: '/crm' },
        { icon: MessageSquare, label: 'Mkt. WhatsApp', path: '/commercial/whatsapp-marketing' },
        { icon: BookOpen, label: 'Pedagógico', path: '/pedagogical' },
        { icon: Calendar, label: 'Calendário', path: '/calendar' },
    ];

    const getRoleLabel = (role) => {
        const map = {
            'master': 'Master',
            'director': 'Diretor',
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
        <>
            {/* Mobile Toggle Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                aria-label="Toggle Menu"
            >
                {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div className="sidebar-overlay" onClick={closeMobile} />
            )}

            <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* Mobile Close Button */}
                {isMobileOpen && (
                    <button className="mobile-close-btn" onClick={closeMobile} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)' }}>
                        <X size={24} />
                    </button>
                )}

                <div className="sidebar-header">
                    <div className="logo">
                        <NavLink to="/dashboard" onClick={closeMobile} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src={logo} alt="Vox2you" style={{ height: '32px', width: 'auto' }} />
                            <span>Vox2You</span>
                        </NavLink>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeMobile}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={24} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <NavLink
                        to="/settings"
                        onClick={closeMobile}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        style={{ marginBottom: '10px' }}
                    >
                        <Settings size={24} />
                        <span>Controles</span>
                    </NavLink>

                    <div className="user-profile">
                        <div className="avatar-lg" style={{
                            background: user?.color || '#10b981',
                            color: '#fff',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}>
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : <Users size={20} />}
                        </div>

                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{getRoleLabel(user?.role)}</span>
                        </div>

                        <button className="logout-btn" onClick={logout} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <LogOut size={20} />
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SidebarSlim;
