import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, MessageSquare, Settings, LogOut, PieChart, DollarSign } from 'lucide-react';

const Sidebar = () => {
    const { logout } = useAuth();

    // Estilo inline para garantir que funcione sem depender de arquivo externo
    const linkStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        textDecoration: 'none',
        color: '#555',
        fontSize: '15px',
        transition: '0.2s'
    };

    const activeStyle = {
        ...linkStyle,
        backgroundColor: '#fff8e1', // Fundo amarelo claro
        color: '#ECA523', // Gold
        borderRight: '4px solid #ECA523',
        fontWeight: 'bold'
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                <h2 style={{ margin: 0, fontSize: '22px' }}>Vox<span style={{ color: '#ECA523' }}>2You</span></h2>
            </div>

            {/* Navegação */}
            <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
                <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
                    <LayoutDashboard size={18} /> Dashboard
                </NavLink>
                <NavLink to="/crm" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
                    <PieChart size={18} /> CRM
                </NavLink>
                <NavLink to="/marketing" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
                    <MessageSquare size={18} /> Marketing
                </NavLink>
                <NavLink to="/financial" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
                    <DollarSign size={18} /> Financeiro
                </NavLink>
                <NavLink to="/users" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
                    <Users size={18} /> Equipe
                </NavLink>
            </nav>

            {/* Rodapé do Menu */}
            <div style={{ borderTop: '1px solid #eee', padding: '10px 0' }}>
                <NavLink to="/settings" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
                    <Settings size={18} /> Configurações
                </NavLink>
                <button
                    onClick={logout}
                    style={{
                        ...linkStyle,
                        background: 'transparent',
                        border: 'none',
                        width: '100%',
                        cursor: 'pointer',
                        color: '#d32f2f'
                    }}
                >
                    <LogOut size={18} /> Sair
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
