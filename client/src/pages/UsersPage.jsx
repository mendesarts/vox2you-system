import React, { useState, useEffect } from 'react';
import {
    UserPlus,
    Edit,
    Trash2,
    X,
    Save,
    Search,
    User
} from 'lucide-react';
import { api } from '../services/api';
import { ROLE_LABELS, ROLE_COLORS } from '../utils/roles';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // State for Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: '20', // Default Franqueado
        whatsapp: '',
        unitName: '', // For Master creating new units
        password: 'Vox2You@2025' // Default visible password
    });

    const [currentUserRole, setCurrentUserRole] = useState(null);

    useEffect(() => {
        fetchUsers();
        // Simulate getting current user role from localStorage/Auth context
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setCurrentUserRole(storedUser.roleId);
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.fetchUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            // alert('Erro ao carregar usuários');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.updateUser(formData.id, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    whatsapp: formData.whatsapp
                });
            } else {
                await api.createUser({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    whatsapp: formData.whatsapp,
                    unitName: formData.unitName
                });
            }
            fetchUsers();
            closeModal();
        } catch (error) {
            console.error('Operation failed:', error);
            alert('Erro ao salvar usuário: ' + (error.message));
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
            try {
                await api.deleteUser(userId);
                fetchUsers();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Erro ao excluir');
            }
        }
    };

    const openModal = (user = null) => {
        if (user) {
            setIsEditMode(true);
            setFormData({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roleId || '20',
                whatsapp: user.whatsapp || '',
                password: '' // Don't show hash
            });
        } else {
            setIsEditMode(false);
            setFormData({
                name: '',
                email: '',
                role: '20',
                whatsapp: '',
                unitName: '',
                password: 'Vox2You@2025'
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditMode(false);
    };

    // Filter Users
    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Gestão de Equipe</h1>
                    <p className="text-gray-500 mt-1">Gerencie franqueados, gestores e colaboradores.</p>
                </div>

                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all transform hover:-translate-y-0.5 font-semibold"
                >
                    <UserPlus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8 relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm shadow-sm"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredUsers.map((user) => {
                    const roleStyle = ROLE_COLORS[user.roleId] || 'text-gray-500 bg-gray-100 border-gray-200';
                    const roleLabel = ROLE_LABELS[user.roleId] || 'Desconhecido';

                    return (
                        <div key={user.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border border-gray-100 flex flex-col">
                            {/* Card Header (Color Strip) */}
                            <div className={`h-2 w-full ${roleStyle.split(' ').find(c => c.startsWith('bg-'))?.replace('bg-', 'bg-') || 'bg-gray-200'}`}></div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold text-xl">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${roleStyle}`}>
                                        {roleLabel}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-800 mb-1 truncate">{user.name}</h3>
                                <p className="text-sm text-gray-500 mb-4 truncate">{user.email}</p>

                                {/* Unit Info (if applicable) */}
                                {user.unit && (
                                    <div className="mt-auto mb-4 bg-gray-50 p-2 rounded text-xs text-gray-600">
                                        🏠 {user.unit}
                                    </div>
                                )}

                                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => openModal(user)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Edit size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="flex items-center justify-center p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL (Popup) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                        {/* Modal Header */}
                        <div className="bg-gray-900 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {isEditMode ? <Edit size={20} className="text-amber-400" /> : <UserPlus size={20} className="text-amber-400" />}
                                {isEditMode ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
                            </h2>
                            <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="pl-10 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2.5 border"
                                        placeholder="Ex: Ana Silva"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2.5 border"
                                    placeholder="ana@vox2you.com.br"
                                />
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo / Função</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2.5 border bg-white"
                                >
                                    {Object.entries(ROLE_LABELS).map(([id, label]) => (
                                        <option key={id} value={id}>{id} - {label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Whatsapp */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={handleInputChange}
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2.5 border"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            {/* Unit Name (Master Only) - Simplified Logic */}
                            {!isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Unidade (Opcional)</label>
                                    <input
                                        type="text"
                                        name="unitName"
                                        value={formData.unitName}
                                        onChange={handleInputChange}
                                        placeholder="Se criar Franqueado/Gestor..."
                                        className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2.5 border"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Preencha apenas se estiver criando uma Nova Unidade.</p>
                                </div>
                            )}

                            {/* Password Display/Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                                <input
                                    type="text" // Visible text as requested
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm p-2.5 border bg-yellow-50 text-amber-900 font-mono"
                                    placeholder="Senha..."
                                />
                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                    ℹ️ Padrão sugerido: Vox2You@2025
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 mt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {isEditMode ? 'Salvar Alterações' : 'Criar Usuário'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
