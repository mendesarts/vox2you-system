import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, Lock } from 'lucide-react';
import RegisterUserPremium from '../components/RegisterUserPremium';
import { api } from '../services/api';
import { ROLE_IDS, ROLE_GROUPS, ROLE_LABELS, ROLE_COLORS } from '../config/roles';
import { VoxButton, VoxCard, VoxModal, VoxBadge } from '../components/VoxUI';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [currentUser, setCurrentUser] = useState({ role: 'indefinido', unit: '', roleId: 0, unitId: null });

    useEffect(() => {
        detectUser();
        fetchUsers();
    }, []);

    const detectUser = () => {
        const keys = ['user', 'vox_user', 'auth_user', 'sb-user', 'usuario'];
        for (const key of keys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    const userObj = parsed.user || parsed;
                    setCurrentUser(userObj || {});
                    return;
                } catch (e) { console.error(e); }
            }
        }
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.fetchUsers();
            const list = Array.isArray(res) ? res : (res.users || res.data || []);
            setUsers(list);
        } catch (error) { console.error("Erro busca:", error); }
        finally { setLoading(false); }
    };

    const handleSaveUser = async (userData) => {
        try {
            const payload = {
                name: userData.name,
                email: userData.email,
                role: userData.role?.toLowerCase() || 'consultor',
                unit: (userData.unit && userData.unit !== 'Carregando...') ? userData.unit : currentUser.unit,
                phone: userData.phone || '',
                id: userData.id || undefined
            };

            let response;
            if (userData.id) {
                response = await api.updateUser(userData.id, payload);
            } else {
                const tempPassword = 'Vox2You@2025';
                const createPayload = { ...payload, password: tempPassword };
                response = await api.createUser(createPayload);
                alert(`✅ Usuário criado!\nSenha: ${tempPassword}\n\nCopie agora!`);
            }

            if (userData.id) alert('Usuário atualizado com sucesso!');
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            const serverError = error.message || "Erro desconhecido";
            alert(`Erro ao salvar: ${serverError}`);
        }
    };

    const handleResetPassword = async (user) => {
        if (!window.confirm(`Resetar senha de ${user.name} para 'Vox2You@2025'?`)) return;
        try {
            await api.updateUser(user.id, { password: 'Vox2You@2025' });
            alert(`✅ Senha resetada: Vox2You@2025`);
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
        try {
            await api.deleteUser(id);
            fetchUsers();
        } catch (e) { alert('Erro ao deletar'); }
    };

    // PERMISSIONS:
    // Global: sees all.
    // Admin (Franchisee/Manager): sees only their unit.
    const isGlobalAdmin = ROLE_GROUPS.GLOBAL.includes(currentUser.roleId || 0);
    const canCreateUser = ROLE_GROUPS.ADMIN.includes(currentUser.roleId || 0);

    const secureUsers = users.filter(u => {
        if (isGlobalAdmin) return true;
        if (!currentUser.unitId) return false;
        return u.unitId === currentUser.unitId;
    });

    const filteredUsers = secureUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-vox-dark font-heading">Gestão de Usuários</h1>
                    <p className="text-muted mt-2 font-serif italic text-lg opacity-80">
                        Gerencie o acesso e permissões da sua equipe.
                    </p>
                </div>
                {canCreateUser && (
                    <VoxButton
                        variant="primary"
                        icon={Plus}
                        onClick={() => {
                            setEditingUser(null);
                            setIsModalOpen(true);
                        }}
                    >
                        Novo Usuário
                    </VoxButton>
                )}
            </div>

            {/* SEARCH */}
            <div className="mb-8 relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="vox-input pl-10"
                />
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in duration-300">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                        // Brand Color Logic
                        let brandColor = 'transparent';
                        if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(user.roleId)) brandColor = 'vox-gold';
                        else if ([ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER].includes(user.roleId)) brandColor = 'vox-teal';

                        return (
                            <VoxCard key={user.id} statusColor={brandColor} className="flex flex-col justify-between h-full group hover:shadow-xl transition-all">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="bg-gray-100 p-3 rounded-full text-gray-600 font-bold w-12 h-12 flex items-center justify-center text-xl">
                                            {user.name.charAt(0)}
                                        </div>
                                        <VoxBadge color={brandColor === 'vox-gold' ? 'gold' : 'teal'}>
                                            {ROLE_LABELS[user.roleId] || user.role}
                                        </VoxBadge>
                                    </div>

                                    <h3 className="text-lg font-bold text-vox-dark mb-1">{user.name}</h3>
                                    <div className="text-sm text-muted mb-4 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${user.active !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {user.email}
                                    </div>

                                    {user.unitName && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-4">
                                            <MapPin size={14} />
                                            {user.unitName}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleResetPassword(user)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg" title="Resetar Senha"><Lock size={18} /></button>
                                    {canCreateUser && (
                                        <>
                                            <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Editar"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Excluir"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </div>
                            </VoxCard>
                        );
                    })
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <Search size={48} className="text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-600">Nenhum usuário encontrado</h3>
                    </div>
                )}
            </div>

            <VoxModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingUser ? `Editar ${editingUser.name}` : "Novo Usuário"}
            >
                <RegisterUserPremium
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                    initialData={editingUser || {}}
                />
            </VoxModal>
        </div>
    );
};

export default UsersPage;
