import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const RegisterUser = ({ onClose, onSave, currentUser }) => {
    // QUEM PODE EDITAR LIVREMENTE (Master/Diretor)
    const GLOBAL_ADMINS = ['master', 'director', 'diretor', 'franqueadora'];
    const isGlobalAdmin = GLOBAL_ADMINS.includes(currentUser?.role);

    // QUEM PODE CRIAR USUÁRIOS (Inclui Franqueado agora)
    const CAN_CREATE_USERS = [...GLOBAL_ADMINS, 'franqueado', 'admin'];

    // Se o usuário atual não tiver permissão, nem deveria estar aqui, mas protegemos:
    if (!CAN_CREATE_USERS.includes(currentUser?.role)) return null;

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'sales',
        unit: '',
        phone: ''
    });

    const [error, setError] = useState('');

    // Configura unidade inicial (Herança Obrigatória para Franqueados)
    useEffect(() => {
        if (!isGlobalAdmin) {
            setFormData(prev => ({ ...prev, unit: currentUser?.unit || '' }));
        }
    }, [currentUser, isGlobalAdmin]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generatePassword = () => {
        return Math.random().toString(36).slice(-8) + "1!";
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.unit || formData.unit.trim() === '') {
            setError('A unidade é obrigatória.');
            return;
        }

        const tempPassword = generatePassword();

        const newUser = {
            id: Date.now().toString(),
            name: formData.name,
            email: formData.email,
            role: formData.role,
            unit: formData.unit,
            password: tempPassword,
            createdAt: new Date().toISOString(),
            avatar: null
        };

        onSave(newUser);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
            {/* CARD COM SUPORTE A DARK/LIGHT MODE */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                {/* Cabeçalho */}
                <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Novo Usuário</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-200 text-sm rounded border border-red-100 dark:border-red-800">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                        <input name="name" type="text" required value={formData.name} onChange={handleChange}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input name="email" type="email" required value={formData.email} onChange={handleChange}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                        />
                    </div>

                    {/* Perfil */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil</label>
                        <select name="role" value={formData.role} onChange={handleChange}
                            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="sales">Consultor</option>
                            <option value="manager">Gestor</option>
                            <option value="financial">Financeiro</option>
                            <option value="pedagogico">Pedagógico</option>

                            {/* Franqueado só pode criar operacionais. Master cria outros Franqueados. */}
                            {isGlobalAdmin && (
                                <>
                                    <option value="franqueado">⭐ Franqueado</option>
                                    <option value="diretor">👑 Diretor</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* Unidade */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
                        <input name="unit" type="text" required readOnly={!isGlobalAdmin} value={formData.unit} onChange={handleChange}
                            className={`w-full rounded-lg border px-3 py-2 outline-none transition-colors ${!isGlobalAdmin
                                    ? 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-500 dark:text-gray-300 cursor-not-allowed'
                                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500'
                                }`}
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button type="submit"
                            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUser;
