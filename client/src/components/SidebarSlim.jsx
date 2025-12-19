import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, MessageSquare, Settings, LogOut, Briefcase, BookOpen, CheckSquare, Menu, X, Bot } from 'lucide-react';
import './sidebar.css';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo-full-white.png';
import { ROLE_GROUPS } from '../config/roles';

const SidebarSlim = () => {
    const { user, logout } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const closeMobile = () => setIsMobileOpen(false);

    const getFilteredNavItems = () => {
        if (!user) return [];
        const roleId = user.roleId || 0;

        // Common items for everyone
        const commonItems = [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Calendar, label: 'Calendário', path: '/calendar' },
            { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
            { icon: MessageSquare, label: 'Mkt. WhatsApp', path: '/commercial/whatsapp-marketing' }
        ];

        // ID-Based Logic
        if (ROLE_GROUPS.ADMIN.includes(roleId)) {
            return [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
                { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
                { icon: Briefcase, label: 'Administrativo', path: '/administrative' },
                { icon: Users, label: 'Comercial', path: '/crm' },
                { icon: MessageSquare, label: 'Mkt. WhatsApp', path: '/commercial/whatsapp-marketing' },
                { icon: BookOpen, label: 'Pedagógico', path: '/pedagogical' },
                { icon: Calendar, label: 'Calendário', path: '/calendar' },
            ];
        }

        if (ROLE_GROUPS.COMMERCIAL.includes(roleId)) {
            return [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
                { icon: Users, label: 'Comercial', path: '/crm' },
                { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
                { icon: MessageSquare, label: 'Mkt. WhatsApp', path: '/commercial/whatsapp-marketing' },
                { icon: Calendar, label: 'Calendário', path: '/calendar' },
            ];
        }

        if (ROLE_GROUPS.PEDAGOGICAL.includes(roleId)) {
            return [
                { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
                { icon: BookOpen, label: 'Pedagógico', path: '/pedagogical' },
                { icon: CheckSquare, label: 'Tarefas', path: '/tasks' },
                { icon: MessageSquare, label: 'Mkt. WhatsApp', path: '/commercial/whatsapp-marketing' },
                { icon: Calendar, label: 'Calendário', path: '/calendar' },
            ];
        }

        return commonItems;
    };

    const navItems = getFilteredNavItems();

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

                    <div className="user-profile" title={`${user?.name || 'Usuário'} (${getRoleLabel(user?.role)})`}>
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
                            border: '2px solid rgba(255,255,255,0.2)',
                            cursor: 'help'
                        }}>
                            {user?.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                                <span>{user?.name?.charAt(0) || <Users size={20} />}</span>
                            )}
                        </div>

                        {/* Hidden on desktop, shown on mobile */}
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{getRoleLabel(user?.role)}</span>
                        </div>

                        {/* LogOut is now better placed or integrated differently, lets keep it beside avatar on mobile or similar, 
                           but for slim sidebar, we might need a separate logout button if space permits.
                           However, requested design is compact. Let's keep logout button but ensure it fits.
                        */}
                        <button className="logout-btn" onClick={logout} title="Sair do Sistema" style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                            <LogOut size={20} />
                            <span className="mobile-only" style={{ marginLeft: '8px', display: 'none' }}>Sair</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default SidebarSlim;
