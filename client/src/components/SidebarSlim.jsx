import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard, PieChart, Target, GraduationCap, Briefcase, Calendar, CheckSquare, DollarSign, Settings, LogOut, Wallet, Activity, BarChart3, AlertTriangle, Users
} from 'lucide-react';

import logoFinal from '../assets/voxflow-logo-final.png';

const SidebarSlim = () => {
    const { logout, user, selectedUnit } = useAuth();
    const [taskCount, setTaskCount] = useState(0);
    const [atRiskCount, setAtRiskCount] = useState(0);

    useEffect(() => {
        const fetchTasksCount = async () => {
            if (!user) return;
            try {
                // Wide range to catch overdue and upcoming
                const start = new Date();
                start.setDate(start.getDate() - 60);
                const end = new Date();
                end.setDate(end.getDate() + 30);

                const s = start.toISOString().split('T')[0];
                const e = end.toISOString().split('T')[0];

                const token = localStorage.getItem('token');
                if (!token) return;

                let url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tasks?summary=true&start=${s}&end=${e}`;
                if (selectedUnit) url += `&unitId=${selectedUnit}`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setTaskCount(data.count || 0);
                }
            } catch (error) {
                console.error("Error fetching task count:", error);
            }
        };

        const fetchAtRiskCount = async () => {
            if (!user) return;
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/reports/students-at-risk`;
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setAtRiskCount(data.total || 0);
                }
            } catch (error) {
                console.error("Error fetching at-risk count:", error);
            }
        };

        fetchTasksCount();
        fetchAtRiskCount();
        const interval = setInterval(() => {
            fetchTasksCount();
            fetchAtRiskCount();
        }, 60000);
        return () => clearInterval(interval);
    }, [user, selectedUnit]);

    // Map roles for display
    const ROLES_MAP = {
        1: 'Master',
        10: 'Diretor',
        20: 'Franqueado',
        30: 'Gestor',
        40: 'Líder Comercial',
        41: 'Consultor',
        50: 'Líder Pedagógico',
        51: 'Pedagógico',
        60: 'Administrativo'
    };

    const displayRole = ROLES_MAP[Number(user?.roleId)] || user?.role || 'Acesso';
    const displayUnit = user?.unit || 'Matriz';
    const userName = user?.name ? user.name.split(' ').slice(0, 2).join(' ') : 'Usuário';

    // Estilo do Link
    const linkBase = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '86px',
        height: '56px',
        borderRadius: '14px',
        marginBottom: '8px',
        color: 'rgba(255, 255, 255, 0.7)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        textDecoration: 'none',
        gap: '2px',
        border: 'none',
        background: 'transparent'
    };

    const activeStyle = {
        ...linkBase,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        color: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(8px)',
        transform: 'scale(1.05)',
        paddingTop: '2px',
        paddingBottom: '2px'
    };

    const labelStyle = {
        fontSize: '8px',
        fontWeight: '700',
        textTransform: 'uppercase',
        textAlign: 'center',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        letterSpacing: '0.3px'
    };

    const roleId = Number(user?.roleId);

    // Visibility Logic
    const hasPanel = [1, 10, 20, 30].includes(roleId);
    const hasCommercial = [1, 10, 20, 30, 40, 41].includes(roleId);
    const hasPedagogical = [1, 10, 20, 30, 50, 51].includes(roleId);
    const hasAdmin = [1, 10, 20, 30, 60].includes(roleId);
    const hasCRM = [1, 10, 20, 30, 40, 41].includes(roleId);

    return (
        <div className="sidebar-slim">

            {/* Logo */}
            <div style={{ padding: '0 0 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                    width: '80px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <img src={logoFinal} alt="VoxFlow" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
            </div>

            {/* Navegação */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', overflowY: 'auto', padding: '0 2px', scrollbarWidth: 'none' }}>

                {hasPanel && (
                    <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Gestão Global">
                        <LayoutDashboard size={20} strokeWidth={2.5} />
                        <span style={labelStyle}>Gestão</span>
                    </NavLink>
                )}

                {hasCommercial && (
                    <NavLink to="/commercial" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Comercial">
                        <Target size={20} strokeWidth={2.5} />
                        <span style={labelStyle}>Comercial</span>
                    </NavLink>
                )}

                {hasPedagogical && (
                    <NavLink to="/pedagogical" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Pedagógico">
                        <div style={{ position: 'relative' }}>
                            <GraduationCap size={20} strokeWidth={2.5} />
                            {atRiskCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-8px',
                                    backgroundColor: '#FF3B30',
                                    color: 'white',
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    height: '14px',
                                    minWidth: '14px',
                                    borderRadius: '7px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 3px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {atRiskCount}
                                </span>
                            )}
                        </div>
                        <span style={labelStyle}>Pedagógico</span>
                    </NavLink>
                )}

                {hasAdmin && (
                    <NavLink to="/secretary" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Administrativo">
                        <Briefcase size={20} strokeWidth={2.5} />
                        <span style={{ ...labelStyle, letterSpacing: '-0.3px' }}>Administrativo</span>
                    </NavLink>
                )}

                {hasAdmin && (
                    <NavLink to="/financial" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Financeiro">
                        <DollarSign size={20} strokeWidth={2.5} />
                        <span style={labelStyle}>Financeiro</span>
                    </NavLink>
                )}



                {hasCRM && (
                    <NavLink to="/crm" style={({ isActive }) => isActive ? activeStyle : linkBase} title="CRM">
                        <PieChart size={20} strokeWidth={2.5} />
                        <span style={labelStyle}>CRM</span>
                    </NavLink>
                )}

                <NavLink to="/calendar" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Agenda">
                    <Calendar size={20} strokeWidth={2.5} />
                    <span style={labelStyle}>Agenda</span>
                </NavLink>

                <NavLink to="/tasks" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Tarefas">
                    <div style={{ position: 'relative' }}>
                        <CheckSquare size={20} strokeWidth={2.5} />
                        {taskCount > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-8px',
                                backgroundColor: '#FF3B30',
                                color: 'white',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                height: '14px',
                                minWidth: '14px',
                                borderRadius: '7px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0 3px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}>
                                {taskCount > 99 ? '99+' : taskCount}
                            </span>
                        )}
                    </div>
                    <span style={labelStyle}>Tarefas</span>
                </NavLink>

            </nav>

            {/* Footer */}
            <div style={{
                marginTop: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                paddingBottom: '24px'
            }}>
                <NavLink to="/settings" style={({ isActive }) => isActive ? activeStyle : linkBase} title="Configurações">
                    <Settings size={20} strokeWidth={2.5} />
                    <span style={{ ...labelStyle, letterSpacing: '-0.3px' }}>Configurações</span>
                </NavLink>

                {/* Logout Button - Moved up to group with Settings */}
                <button
                    onClick={logout}
                    title="Sair"
                    style={{
                        ...linkBase,
                        background: 'rgba(255, 59, 48, 0.15)',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        cursor: 'pointer',
                        marginBottom: '16px',
                        height: '48px' // Slightly slimmer for group look
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.3)';
                        e.currentTarget.style.borderColor = '#FF3B30';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.3)';
                    }}
                >
                    <LogOut size={18} color="#FF3B30" strokeWidth={3} />
                    <span style={{ ...labelStyle, color: '#FF3B30', fontSize: '7px' }}>SAIR</span>
                </button>

                {/* Bloco de Informações do Desenvolvedor/Usuário - 3 Linhas */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0 6px',
                    textAlign: 'center',
                    width: '100%',
                    gap: '1px'
                }}>
                    {/* Linha 1: Nome (Fonte Dinâmica via clamp) */}
                    <span style={{
                        fontSize: 'clamp(7px, 1.2vw, 9px)',
                        fontWeight: '900',
                        color: '#FFFFFF',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2px'
                    }}>
                        {userName}
                    </span>

                    {/* Linha 2: Cargo (Corrigido para Nome do Cargo) */}
                    <span style={{
                        fontSize: 'clamp(6px, 1vw, 8px)',
                        fontWeight: '700',
                        color: 'rgba(255, 255, 255, 0.6)',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textTransform: 'uppercase',
                        letterSpacing: '0.3px'
                    }}>
                        {displayRole}
                    </span>

                    {/* Linha 3: Unidade (Destaque em Teal) */}
                    <span style={{
                        fontSize: 'clamp(6px, 0.9vw, 7px)',
                        fontWeight: '800',
                        color: '#30B0C7',
                        width: '100%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1px'
                    }}>
                        {displayUnit}
                    </span>
                </div>
            </div>

        </div>
    );
};

export default SidebarSlim;
