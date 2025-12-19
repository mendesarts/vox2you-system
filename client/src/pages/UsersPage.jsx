import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, ShieldCheck } from 'lucide-react';
import RegisterUser from '../components/RegisterUserPremium';
import { api } from '../services/api';
import { ROLE_IDS, ROLE_GROUPS } from '../config/roles';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [currentUser, setCurrentUser] = useState({ role: 'indefinido', unit: '', roleId: 0, unitId: null });

    const roleMap = {
        'master': 'Master', 'director': 'Diretor', 'diretor': 'Diretor',
        'franqueado': 'Franqueado', 'franchisee': 'Franqueado',
        'manager': 'Gestor', 'lider_comercial': 'Líder Comercial',
        'lider_pedagogico': 'Líder Pedagógico', 'admin_financeiro': 'Financeiro',
        'pedagogico': 'Pedagógico', 'consultor': 'Consultor', 'sales': 'Consultor'
    };

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

    useEffect(() => {
        detectUser();
        fetchUsers();
    }, []);

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
            // 1. LIMPEZA TOTAL DE DADOS (Payload Sanitization)
            const payload = {
                name: userData.name,
                email: userData.email,
                role: userData.role?.toLowerCase() || 'consultor',
                unit: (userData.unit && userData.unit !== 'Carregando...') ? userData.unit : currentUser.unit,
                phone: userData.phone || '',
                // Se for criação (sem id), o backend DEVE gerar o UUID. 
                // Se for edição, enviamos o id.
                id: userData.id || undefined
            };

            console.log("📤 TENTANDO ENVIAR PAYLOAD:", payload);

            let response;
            if (userData.id) {
                // EDIÇÃO
                response = await api.updateUser(userData.id, payload);
            } else {
                // CRIAÇÃO: Senha Padrão Temporária
                const tempPassword = 'Vox2You@2025';
                const createPayload = { ...payload, password: tempPassword };
                response = await api.createUser(createPayload);

                // FEEDBACK VISUAL COM CREDENCIAIS
                const data = response.user || response || {};
                alert(
                    `✅ Usuário criado com sucesso!\n\n` +
                    `📧 Email: ${payload.email}\n` +
                    `🔑 Senha Temporária: ${tempPassword}\n` +
                    `🏢 ID Unidade: ${data.unitId || payload.unit || 'Global'}\n` +
                    `\nCopie estas informações agora!`
                );
            }

            if (userData.id) alert('Usuário atualizado com sucesso!');

            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();

        } catch (error) {
            // 2. CAPTURA DO ERRO REAL DO BACKEND
            const serverError = error.message || "Erro desconhecido";
            console.error("❌ ERRO DETALHADO DO SERVIDOR:", serverError);

            if (serverError.includes('unique constraint') || serverError.includes('already exists')) {
                alert("ERRO: Este email já está cadastrado em outro usuário.");
            } else if (serverError.includes('invalid input syntax for type uuid')) {
                alert("ERRO DE SISTEMA: Conflito de ID. Tente criar um novo usuário do zero.");
            } else {
                alert(`Erro ao salvar: ${serverError}`);
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm("Tem certeza?")) return;
        try {
            await api.deleteUser(id);
            fetchUsers();
        } catch (e) {
            alert('Erro ao deletar');
        }
    };

    // STRICT ID FILTER LOGIC
    const isGlobalAdmin = ROLE_GROUPS.GLOBAL.includes(currentUser.roleId || 0);

    const secureUsers = users.filter(u => {
        if (isGlobalAdmin) return true;

        // Safety: If current user has no unitId (unexpected), show nothing
        if (!currentUser.unitId) return false;

        // Strict UUID Match
        return u.unitId === currentUser.unitId;
    });

    const filteredUsers = secureUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h1>
                </div>
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            {loading ? <div className="text-center py-20 animate-pulse text-indigo-500 font-bold">Carregando seus usuários...</div> : (
                <>
                    {filteredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Search size={40} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Nenhum usuário encontrado</h3>
                            <p className="text-gray-500 mt-2 text-center max-w-sm">Parece que ainda não há ninguém cadastrado nesta unidade ou perfil. Clique em "Novo Usuário" para começar.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredUsers.map((user) => {
                                // COLOR LOGIC
                                let roleColor = "bg-gray-100 text-gray-700 border-gray-200"; // Default
                                const rid = user.roleId || 0;

                                if (rid === 1 || rid === 10) roleColor = "bg-amber-100 text-amber-800 border-amber-200"; // Master/Director (Gold)
                                else if (rid === 20) roleColor = "bg-green-100 text-green-800 border-green-200"; // Franchisee (Green)
                                else if (rid === 30) roleColor = "bg-blue-100 text-blue-800 border-blue-200"; // Manager (Blue)
                                else if (rid === 40 || rid === 50) roleColor = "bg-purple-100 text-purple-800 border-purple-200"; // Leaders (Purple)

                                return (
                                    <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all relative group flex flex-col justify-between h-full">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm ${roleColor.split(' ')[0]}`}>
                                                    {user.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleColor}`}>
                                                    {roleMap[user.role?.toLowerCase()] || user.role}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-gray-900 truncate tracking-tight">{user.name}</h3>
                                            <p className="text-sm text-gray-500 mb-4 truncate flex items-center gap-1">
                                                <span className="text-xs">📧</span> {user.email}
                                            </p>

                                            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-gray-50 rounded-lg w-full">
                                                <MapPin size={14} className="text-gray-400 min-w-[14px]" />
                                                <span className="text-xs font-medium text-gray-600 truncate">
                                                    {user.unit || 'Aguardando vínculo...'}
                                                </span>
                                                {/* Debug UnitID for Master */}
                                                {isGlobalAdmin && <span className="text-[8px] text-gray-300 ml-auto">{user.unitId?.slice(0, 4)}</span>}
                                            </div>
                                        </div>

                                        <div className="mt-6 flex gap-2 border-t border-gray-100 pt-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                                            <button
                                                onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} /> Editar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="w-10 flex items-center justify-center rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <RegisterUser
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                    currentUser={currentUser}
                    userToEdit={editingUser}
                />
            )}
        </div>
    );
};
export default UsersPage;
