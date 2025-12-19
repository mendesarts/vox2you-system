import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, User, Search, ShieldCheck, X } from 'lucide-react';
// IMPORTANTE: Importando o modal FINAL que funciona
import RegisterUser from '../components/RegisterUserFinal';
import { api } from '../services/api'; // Correctly using named import based on file check

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // Usuário logado
    const [showModal, setShowModal] = useState(false); // Legacy state support if needed, but using isRegisterModalOpen primarily
    const [isEditing, setIsEditing] = useState(false); // Legacy state support

    // Sync states
    useEffect(() => { setIsRegisterModalOpen(showModal) }, [showModal]);

    // MAPA DE TRADUÇÃO DE CARGOS (Blindado)
    const roleTranslations = {
        'master': 'Master',
        'director': 'Diretor',
        'diretor': 'Diretor',
        'franqueado': 'Franqueado',
        'franchisee': 'Franqueado', // Corrige o termo em inglês
        'manager': 'Gestor',
        'lider_comercial': 'Líder Comercial',
        'lider_pedagogico': 'Líder Pedagógico',
        'admin_financeiro': 'Financeiro',
        'pedagogico': 'Pedagógico',
        'sales': 'Consultor',
        'consultor': 'Consultor',
        'admin': 'Admin'
    };

    // Função segura para pegar o nome do cargo
    const getRoleLabel = (role) => {
        if (!role) return 'Indefinido';
        // Tenta achar no mapa, se não achar, capitaliza a primeira letra
        return roleTranslations[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
    };

    useEffect(() => {
        fetchUsersData();
        // Simula pegar usuário logado (Ajuste conforme sua auth)
        // In a real app, use useAuth() context
        const storedUser = JSON.parse(localStorage.getItem('vox_user') || '{}');
        setCurrentUser(storedUser);
    }, []);

    const fetchUsersData = async () => {
        try {
            setLoading(true);
            // api.fetchUsers calls /users
            const response = await api.fetchUsers();
            // Ensure response is array. Sometimes response is object { users: [] }
            const list = Array.isArray(response) ? response : (response.users || []);
            setUsers(list);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            // Dados falsos de fallback se a API falhar (para não quebrar a tela)
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            // 1. LIMPEZA DE DADOS (Remove ID para o backend gerar UUID se necessário)
            const { id, ...payload } = userData;

            // Garante que a unidade vá preenchida
            const finalPayload = {
                ...payload,
                unit: payload.unit || "Sem Unidade"
            };

            console.log("Enviando:", finalPayload);

            // Using api.createUser abstraction
            const newUser = await api.createUser(finalPayload);

            // Atualiza lista
            setUsers(prev => [newUser, ...prev]);
            setIsRegisterModalOpen(false);
            setShowModal(false);
            alert(`Usuário ${newUser.name} criado com sucesso!`);

        } catch (error) {
            console.error("Erro ao criar:", error);
            alert("Erro ao salvar usuário. Verifique o console.");
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;
        try {
            await api.deleteUser(userId);
            setUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            alert("Erro ao excluir usuário.");
        }
    };

    // Filtragem
    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <User className="text-indigo-600" /> Gestão de Usuários
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Gerencie acesso, cargos e unidades da sua rede.
                    </p>
                </div>
                <button
                    onClick={() => { setIsRegisterModalOpen(true); setShowModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
                >
                    <Plus size={20} /> Novo Usuário
                </button>
            </div>

            {/* BARRA DE BUSCA */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
            </div>

            {/* LISTAGEM */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando equipe...</div>
            ) : (
                <div className="grid gap-4">
                    {filteredUsers.map((user) => (
                        <div key={user.id || Math.random()} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-4">

                            {/* Info Usuário */}
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md
                  ${['master', 'diretor', 'franqueado', 'franchisee'].includes(user.role) ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                                    {(user.name || '?').charAt(0).toUpperCase()}
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                                        {user.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{user.email}</p>

                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {/* ETIQUETA DE CARGO (CORRIGIDA) */}
                                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                                            <ShieldCheck size={12} />
                                            {getRoleLabel(user.role)}
                                        </span>

                                        {/* ETIQUETA DE UNIDADE (SEGURA) */}
                                        <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 flex items-center gap-1">
                                            <MapPin size={12} />
                                            {user.unit || "Sem Unidade"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="flex gap-2 self-end md:self-center">
                                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500">Nenhum usuário encontrado.</p>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL */}
            {(isRegisterModalOpen || showModal) && (
                <RegisterUser
                    onClose={() => { setIsRegisterModalOpen(false); setShowModal(false); }}
                    onSave={handleCreateUser}
                    currentUser={currentUser || { role: 'admin' }} // Fallback seguro
                />
            )}
        </div>
    );
};

export default UsersPage;
