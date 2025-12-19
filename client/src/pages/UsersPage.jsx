import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, ShieldCheck, RefreshCw } from 'lucide-react';
import RegisterUser from '../components/RegisterUserPremium';
import { api } from '../services/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Controle do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // O USUÁRIO LOGADO (Onde estava o erro)
    const [currentUser, setCurrentUser] = useState({ role: 'indefinido' });

    // Tradução Segura
    const roleMap = {
        'master': 'Master', 'director': 'Diretor', 'diretor': 'Diretor',
        'franqueado': 'Franqueado', 'franchisee': 'Franqueado',
        'manager': 'Gestor', 'lider_comercial': 'Líder Comercial',
        'lider_pedagogico': 'Líder Pedagógico', 'admin_financeiro': 'Financeiro',
        'pedagogico': 'Pedagógico', 'consultor': 'Consultor', 'sales': 'Consultor'
    };

    // --- CORREÇÃO: DETETIVE DE USUÁRIO ---
    useEffect(() => {
        const detectUser = () => {
            console.log("🕵️‍♂️ Iniciando detecção de usuário...");

            // 1. Tenta chaves comuns de LocalStorage
            const keys = ['user', 'vox_user', 'auth_user', 'sb-user', 'app-user'];

            for (const key of keys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        // Verifica se tem 'role' ou se está aninhado em 'user.role'
                        const role = parsed.role || parsed.user?.role;

                        if (role) {
                            console.log(`✅ Usuário encontrado na chave: [${key}]`, parsed);
                            // Normaliza o objeto para o nosso padrão
                            setCurrentUser({
                                ...parsed,
                                ...parsed.user, // Desaninha se necessário
                                role: role // Garante a role no topo
                            });
                            return; // Achou! Para a busca.
                        }
                    } catch (e) { console.warn(`Erro ao ler chave ${key}`, e); }
                }
            }

            console.warn("❌ Nenhuma credencial válida encontrada no Storage.");
            // Se falhar tudo, mantemos 'indefinido' e o usuário verá o alerta na tela.
        };

        detectUser();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Adapted to use existing API service method
            const res = await api.fetchUsers();
            // Handle potential response structures (array or object with key)
            const list = Array.isArray(res) ? res : (res.users || res.data || []);
            setUsers(list);
        } catch (error) {
            console.error("Erro busca:", error);
        } finally { setLoading(false); }
    };

    const handleSaveUser = async (userData) => {
        try {
            const payload = { ...userData, unit: userData.unit || "Sem Unidade" };
            if (userData.id) {
                // Adapted to use existing API service method
                if (api.updateUser) {
                    await api.updateUser(userData.id, payload);
                } else {
                    // Fallback if updateUser was not detected (though it should be)
                    await api.createUser(payload);
                }
                alert('Usuário atualizado com sucesso!');
            } else {
                await api.createUser(payload);
                alert('Usuário criado com sucesso!');
            }
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            alert("Erro ao salvar. Verifique se o email já existe.");
            console.error(error);
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

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleNewClick = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Você está logado como: <strong className="text-indigo-600 uppercase">{currentUser.role || 'Visitante'}</strong>
                    </p>
                </div>
                <button onClick={handleNewClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Buscar usuário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* LISTAGEM (CARDS) */}
            {loading ? <div className="text-center py-10">Carregando...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id || Math.random()} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group relative">

                            <div className="flex items-start justify-between">
                                <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm mb-4
                  ${['master', 'franqueado', 'franchisee'].includes(user.role?.toLowerCase()) ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                                    {(user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-lg hover:bg-indigo-50"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">{user.name}</h3>
                            <p className="text-sm text-gray-500 mb-4 truncate">{user.email}</p>

                            <div className="flex flex-col gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 w-fit border border-indigo-100">
                                    <ShieldCheck size={14} /> {roleMap[user.role?.toLowerCase()] || user.role}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 w-fit border border-gray-200">
                                    <MapPin size={14} /> {user.unit || "Sem Unidade"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
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
