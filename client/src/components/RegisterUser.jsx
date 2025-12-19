import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const RegisterUser = ({ onClose, onSave, currentUser }) => {
    const GLOBAL_ADMINS = ['master', 'director', 'diretor', 'franqueadora'];
    const isGlobalAdmin = GLOBAL_ADMINS.includes(currentUser?.role);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'sales',
        unit: '',
        phone: ''
    });

    // Herança de Unidade
    useEffect(() => {
        if (!isGlobalAdmin) {
            setFormData(prev => ({ ...prev, unit: currentUser?.unit || '' }));
        }
    }, [currentUser, isGlobalAdmin]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.unit) return alert('A unidade é obrigatória!');

        const newUser = {
            id: Date.now().toString(),
            ...formData,
            password: Math.random().toString(36).slice(-8) + "1!", // Gera Senha
            createdAt: new Date().toISOString(),
            avatar: null
        };

        onSave(newUser); // Passa o objeto completo (com senha e unidade)
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

                {/* HEADER */}
                <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Novo Usuário</h2>
                    <button onClick={onClose} className="text-white hover:bg-indigo-700 p-1 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* FORM BODY */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Nome</label>
                        <input name="name" required value={formData.name} onChange={handleChange}
                            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white bg-transparent focus:border-indigo-500 outline-none" placeholder="Nome completo" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Email</label>
                        <input name="email" type="email" required value={formData.email} onChange={handleChange}
                            className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-900 dark:text-white bg-transparent focus:border-indigo-500 outline-none" placeholder="email@exemplo.com" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Perfil</label>
                            <select name="role" value={formData.role} onChange={handleChange}
                                className="w-full border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="sales">Consultor</option>
                                <option value="manager">Gestor</option>
                                <option value="financial">Financeiro</option>
                                <option value="pedagogico">Pedagógico</option>
                                {isGlobalAdmin && (
                                    <>
                                        <option value="franqueado">⭐ Franqueado</option>
                                        <option value="diretor">👑 Diretor</option>
                                    </>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-1">Unidade</label>
                            <input name="unit" required readOnly={!isGlobalAdmin} value={formData.unit} onChange={handleChange}
                                className={`w-full border-2 rounded-lg p-3 outline-none ${!isGlobalAdmin ? 'bg-gray-100 dark:bg-gray-600 text-gray-500' : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'}`} />
                        </div>
                    </div>

                    {/* FOOTER BOTOES - FORÇANDO TAMANHO E ESPAÇAMENTO */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700 mt-2">
                        <button type="button" onClick={onClose}
                            className="h-12 px-6 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit"
                            className="h-12 px-8 rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-transform transform active:scale-95">
                            Salvar Usuário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUser;
