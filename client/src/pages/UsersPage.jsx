import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, ShieldCheck } from 'lucide-react';
import RegisterUser from '../components/RegisterUserPremium';
import { api } from '../services/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Estado do Usuário Logado
    const [currentUser, setCurrentUser] = useState({ role: 'indefinido', unit: '' });

    const roleMap = {
        'master': 'Master', 'director': 'Diretor', 'diretor': 'Diretor',
        'franqueado': 'Franqueado', 'franchisee': 'Franqueado',
        'manager': 'Gestor', 'lider_comercial': 'Líder Comercial',
        'lider_pedagogico': 'Líder Pedagógico', 'admin_financeiro': 'Financeiro',
        'pedagogico': 'Pedagógico', 'consultor': 'Consultor', 'sales': 'Consultor'
    };

    useEffect(() => {
        // 1. DETECÇÃO ROBUSTA DE USUÁRIO
        const detectUser = () => {
            const keys = ['user', 'vox_user', 'auth_user', 'sb-user'];
            for (const key of keys) {
                const data = localStorage.getItem(key);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        const userObj = parsed.user || parsed; // Tenta pegar o objeto user ou o próprio root
                        const role = userObj.role || parsed.role;
                        const unit = userObj.unit || parsed.unit; // Garante que pegamos a unidade

                        if (role) {
                            setCurrentUser({ ...userObj, role, unit }); // Salva com unidade explícita
                            return;
                        }
                    } catch (e) { }
                }
            }
        };
        detectUser();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.fetchUsers();
            // Adjust handling for different response structures if needed, but api.fetchUsers usually returns the data or {users: []}
            // Assuming api.fetchUsers returns the array or object with data needed.
            // Based on previous files, api.fetchUsers returns response.json().
            const list = Array.isArray(res) ? res : (res.users || res.data || []);
            setUsers(list);
        } catch (error) { console.error("Erro busca:", error); }
        finally { setLoading(false); }
    };

    const handleSaveUser = async (userData) => {
        try {
            // Garante que se a unidade vier vazia, usa a do usuário logado (Safety net)
            const finalUnit = userData.unit || currentUser.unit || "Sem Unidade";
            const payload = { ...userData, unit: finalUnit };

            if (userData.id) {
                if (api.updateUser) {
                    await api.updateUser(userData.id, payload);
                } else {
                    await api.createUser(payload); // Fallback
                }
            } else {
                await api.createUser(payload);
            }
            alert('Operação realizada com sucesso!');
            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers();
        } catch (error) { alert("Erro ao salvar usuário."); }
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

    // LÓGICA DE FILTRAGEM DE SEGURANÇA
    const isGlobalAdmin = ['master', 'admin', 'diretor', 'director'].includes(currentUser.role?.toLowerCase());

    // Se for Admin Global, vê tudo. Se não, vê SÓ a própria unidade.
    const secureUsers = users.filter(u => {
        if (isGlobalAdmin) return true;
        // Filtro estrito: Unidade tem que ser idêntica
        // Normalizing units for comparison might be good but let's trust exact match for now as requested
        return u.unit === currentUser.unit;
    });

    const filteredUsers = secureUsers.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Logado como: <strong className="text-indigo-600 uppercase">{currentUser.role}</strong>
                        {!isGlobalAdmin && <span className="ml-2 text-gray-400">({currentUser.unit})</span>}
                    </p>
                </div>
                <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Buscar na sua lista..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {loading ? <div className="text-center">Carregando...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start">
                                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                {/* Só mostra botões de editar se for da mesma hierarquia ou admin */}
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="text-gray-400 hover:text-indigo-600 p-2">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-gray-400 hover:text-red-600 p-2">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-gray-800">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <div className="mt-4 flex gap-2">
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600 uppercase">
                                    {roleMap[user.role?.toLowerCase()] || user.role}
                                </span>
                                <span className="px-2 py-1 bg-blue-50 rounded text-xs font-bold text-blue-600 truncate max-w-[120px]">
                                    {user.unit}
                                </span>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && <p className="text-gray-500 col-span-3 text-center">Nenhum usuário encontrado nesta unidade.</p>}
                </div>
            )}

            {isModalOpen && (
                <RegisterUser
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                    currentUser={currentUser} // Passa o usuário COM a unidade detectada
                    userToEdit={editingUser}
                />
            )}
        </div>
    );
};
export default UsersPage;
