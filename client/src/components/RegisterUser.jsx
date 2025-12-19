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

    const [error, setError] = useState('');

    // Configura unidade inicial
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
        return Math.random().toString(36).slice(-8) + "1!"; // Ex: x7z9q2w1!
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.unit || formData.unit.trim() === '') {
            setError('A unidade é obrigatória.');
            return;
        }

        // GERA A SENHA NO FRONTEND PARA PODER MOSTRAR NO MODAL DE SUCESSO
        const tempPassword = generatePassword();

        const newUser = {
            id: Date.now().toString(),
            ...formData,
            password: tempPassword, // Envia a senha gerada
            createdAt: new Date().toISOString(),
            avatar: null
        };

        console.log("Enviando usuário:", newUser);
        onSave(newUser); // Passa o objeto completo (com senha e unidade)
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">

                {/* Cabeçalho */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800">Novo Usuário</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                        <input name="name" type="text" required value={formData.name} onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Corporativo</label>
                        <input name="email" type="email" required value={formData.email} onChange={handleChange}
                            className="w-full rounded-lg border-gray-300 border px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            placeholder="joao@vox2you.com"
                        />
                    </div>

                    {/* Perfil */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Perfil de Acesso</label>
                        <div className="relative">
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 appearance-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                                <option value="sales">Consultor</option>
                                <option value="manager">Gestor</option>
                                <option value="financial">Financeiro</option>
                                <option value="pedagogico">Pedagógico</option>
                                {isGlobalAdmin && (
                                    <>
                                        <option value="franqueado" className="font-bold text-indigo-600">⭐ Franqueado (Dono)</option>
                                        <option value="diretor" className="font-bold text-purple-600">👑 Diretor</option>
                                    </>
                                )}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                ▼
                            </div>
                        </div>
                    </div>

                    {/* Unidade */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Unidade</label>
                        <input
                            name="unit"
                            type="text"
                            required
                            readOnly={!isGlobalAdmin}
                            value={formData.unit}
                            onChange={handleChange}
                            placeholder="Ex: Brasilia.AsaSul"
                            className={`w-full rounded-lg border px-3 py-2 outline-none transition-all ${!isGlobalAdmin
                                    ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'border-gray-300 focus:ring-2 focus:ring-indigo-500'
                                }`}
                        />
                        {isGlobalAdmin && <p className="text-xs text-gray-400 mt-1">Formato sugerido: Cidade.Bairro</p>}
                    </div>

                    {/* RODAPÉ COM BOTÕES ESTILIZADOS */}
                    <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                        >
                            Criar Usuário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterUser;
