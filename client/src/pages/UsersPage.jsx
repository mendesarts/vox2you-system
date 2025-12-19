import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Search, ShieldCheck } from 'lucide-react';
import RegisterUserFinal from '../components/RegisterUserFinal';
import { api } from '../services/api';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Controle do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // Guarda o usuário sendo editado

    const [currentUser, setCurrentUser] = useState(null);

    // Tradução Segura
    const roleMap = {
        'master': 'Master', 'director': 'Diretor', 'diretor': 'Diretor',
        'franqueado': 'Franqueado', 'franchisee': 'Franqueado',
        'manager': 'Gestor', 'lider_comercial': 'Líder Comercial',
        'lider_pedagogico': 'Líder Pedagógico', 'admin_financeiro': 'Financeiro',
        'pedagogico': 'Pedagógico', 'consultor': 'Consultor', 'sales': 'Consultor'
    };

    useEffect(() => {
        fetchUsers();
        setCurrentUser(JSON.parse(localStorage.getItem('vox_user') || '{}'));
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // api.fetchUsers -> /users
            const res = await api.fetchUsers();
            const list = Array.isArray(res) ? res : (res.users || []);
            setUsers(list);
        } catch (error) {
            console.error("Erro busca:", error);
        } finally { setLoading(false); }
    };

    // Salvar (Cria ou Edita)
    const handleSaveUser = async (userData) => {
        try {
            const payload = { ...userData, unit: userData.unit || "Sem Unidade" };

            if (userData.id) {
                // EDIÇÃO (PUT)
                if (api.updateUser) {
                    await api.updateUser(userData.id, payload);
                } else {
                    // Fallback if updateUser not ready yet (though we added it)
                    await api.createUser(payload);
                }
                alert('Usuário atualizado!');
            } else {
                // CRIAÇÃO (POST)
                await api.createUser(payload);
                alert('Usuário criado!');
            }

            setIsModalOpen(false);
            setEditingUser(null);
            fetchUsers(); // Recarrega lista
        } catch (error) {
            alert("Erro ao salvar. Verifique o console.");
            console.error(error);
        }
    };

    // Função para abrir Edição
    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    // Função para abrir Criação
    const handleNewClick = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h1>
                <button onClick={handleNewClick} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input type="text" placeholder="Buscar usuário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-800 dark:text-white outline-none" />
            </div>

            {/* GRID DE CARDS (LAYOUT CORRIGIDO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                    <div key={user.id || Math.random()} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative group">

                        <div className="flex items-start justify-between">
                            <div className={`h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm mb-4
                ${['master', 'franqueado', 'franchisee'].includes(user.role) ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                                {(user.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(user)} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-lg hover:bg-indigo-50"><Edit2 size={16} /></button>
                                <button
                                    onClick={async () => {
                                        if (window.confirm("Excluir?")) {
                                            await api.deleteUser(user.id);
                                            fetchUsers();
                                        }
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                        <div className="flex flex-col gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 w-fit">
                                <ShieldCheck size={14} /> {roleMap[user.role] || user.role}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 w-fit">
                                <MapPin size={14} /> {user.unit || "Sem Unidade"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL INTELIGENTE (Criação ou Edição) */}
            {isModalOpen && (
                <RegisterUserFinal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                    currentUser={currentUser}
                    userToEdit={editingUser} // Passa o usuário para edição
                />
            )}
        </div>
    );
};
export default UsersPage;
