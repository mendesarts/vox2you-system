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

            {loading ? <div className="text-center py-20">Carregando lista de usuários...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id || Math.random()} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="text-gray-400 hover:text-indigo-600 p-2">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-gray-400 hover:text-red-600 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-gray-800 truncate">{user.name}</h3>
                            <p className="text-sm text-gray-500 truncate mb-4">{user.email}</p>
                            <div className="flex flex-col gap-2">
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black uppercase w-fit border border-indigo-100">
                                    {roleMap[user.role?.toLowerCase()] || user.role}
                                </span>
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-[10px] font-bold w-fit border border-gray-100 truncate max-w-full">
                                    📍 {user.unit || 'Sem Unidade'}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && <p className="text-gray-500 col-span-3 text-center">Nenhum usuário encontrado nesta unidade (ou carregando...).</p>}
                </div>
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
