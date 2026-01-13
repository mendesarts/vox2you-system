import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Search, Store, Mail, Shield, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RegisterUserPremium from '../components/RegisterUserPremium';

const UsersPage = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [units, setUnits] = useState([]);
    const [unitFilter, setUnitFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
        if ([1, 10].includes(Number(currentUser?.roleId))) {
            fetchUnits();
        }
    }, []);

    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setUnits(data);
        } catch (error) { console.error(error); }
    };

    const fetchUsers = async () => {
        try {
            const data = await api.fetchUsers();
            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                console.error("Expected array of users, got:", data);
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        }
    };

    const handleSaveFromModal = async (userData) => {
        try {
            const payload = { ...userData, roleId: Number(userData.role), whatsapp: userData.phone || userData.whatsapp };
            if (userData.id || selectedUser?.id) await api.updateUser(userData.id || selectedUser.id, payload);
            else await api.createUser(payload);
            fetchUsers();
            setIsModalOpen(false);
            setSelectedUser(null);
        } catch (error) { alert('Erro ao salvar usuário'); }
    };

    const getRoleGroup = (roleId) => {
        const id = Number(roleId);
        if ([1, 10].includes(id)) return 'Governança & Master';
        if (id === 20) return 'Proprietários & Franqueados';
        if (id === 30) return 'Direção de Unidade';
        if ([40, 41].includes(id)) return 'Executivos Comerciais';
        if ([50, 51].includes(id)) return 'Corpo Docente & Pedagógico';
        return 'Suporte & Operações';
    };

    const groupOrder = ['Governança & Master', 'Proprietários & Franqueados', 'Direção de Unidade', 'Executivos Comerciais', 'Corpo Docente & Pedagógico', 'Suporte & Operações'];

    const filteredUsers = users.filter(u => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
        const matchesUnit = unitFilter === 'all' || Number(u.unitId) === Number(unitFilter);
        return matchesSearch && matchesUnit;
    });

    const groupedUsers = filteredUsers.reduce((acc, user) => {
        const group = getRoleGroup(user.roleId);
        if (!acc[group]) acc[group] = [];
        acc[group].push(user);
        return acc;
    }, {});

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>

            {/* Header Master */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Gestão de <span style={{ color: 'var(--ios-teal)' }}>Equipe</span></h1>
                    <p style={{ opacity: 0.5 }}>Configuração de acessos e cargos da rede Vox2You</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {[1, 10].includes(Number(currentUser?.roleId)) && (
                        <div style={{ background: 'rgba(0,0,0,0.05)', padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Store size={16} color="#8E8E93" />
                            <select
                                value={unitFilter}
                                onChange={e => setUnitFilter(e.target.value)}
                                style={{ background: 'transparent', border: 'none', fontWeight: '800', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                            >
                                <option value="all">Todas as Unidades</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div style={{ background: 'rgba(0,0,0,0.05)', padding: '6px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={16} color="#8E8E93" />
                        <input
                            placeholder="Buscar colaborador..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ background: 'transparent', border: 'none', fontWeight: '800', fontSize: '13px', outline: 'none' }}
                        />
                    </div>
                    <button onClick={() => { setSelectedUser(null); setIsModalOpen(true); }} className="btn-primary" style={{ height: '40px', padding: '0 20px', borderRadius: '14px' }}>
                        <UserPlus size={18} /> Novo Usuário
                    </button>
                </div>
            </header>

            {/* Listagem Consolidada */}
            <div className="vox-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(0,0,0,0.01)', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '1px' }}>Colaborador</th>
                            <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '1px' }}>Alocação</th>
                            <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '1px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupOrder.map(groupName => {
                            const groupUsers = groupedUsers[groupName];
                            if (!groupUsers || groupUsers.length === 0) return null;
                            return (
                                <React.Fragment key={groupName}>
                                    <tr style={{ background: 'rgba(52, 199, 89, 0.05)' }}>
                                        <td colSpan="3" style={{ padding: '8px 24px', fontSize: '10px', fontWeight: '900', color: '#248A3D', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {groupName}
                                        </td>
                                    </tr>
                                    {groupUsers.map((u, idx) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '900', fontSize: '16px' }}>{u.name}</div>
                                                        <div style={{ fontSize: '12px', opacity: 0.5, display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={12} /> {u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800' }}>
                                                    <Store size={14} color="#8E8E93" /> {u.unit || 'Matriz Global'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button onClick={() => { setSelectedUser(u); setIsModalOpen(true); }} style={{ border: 'none', background: 'rgba(0,122,255,0.1)', color: '#007AFF', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button style={{ border: 'none', background: 'rgba(255,59,48,0.1)', color: '#FF3B30', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <RegisterUserPremium
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveFromModal}
                    currentUser={currentUser}
                    userToEdit={selectedUser}
                />
            )}
        </div>
    );
};

export default UsersPage;
