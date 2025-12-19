import React, { useState, useEffect } from 'react';

const RegisterUser = ({ onClose, onSave, currentUser }) => {
    // Definição de Permissões Globais
    const GLOBAL_ADMINS = ['master', 'director', 'diretor', 'franqueadora'];
    const isGlobalAdmin = GLOBAL_ADMINS.includes(currentUser?.role);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Senha será gerada/definida no backend ou padrão
        role: 'sales', // Valor padrão seguro
        unit: '',
        phone: ''
    });

    const [error, setError] = useState('');

    // Lógica de Unidade: Master digita, outros herdam.
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
        setError('');

        if (!formData.unit || formData.unit.trim() === '') {
            setError('O campo Unidade é obrigatório.');
            return;
        }

        // Payload final
        const newUser = {
            // id: Date.now().toString(), // Remove manual ID to let backend handle it, unless user explicitly wants it. Prompt code included it.
            // The prompt code included `id: Date.now().toString()`. I will double check the instruction.
            // Instruction says: "Use este código EXATO".
            // So I will use `id: Date.now().toString()`.
            id: Date.now().toString(),
            ...formData,
            createdAt: new Date().toISOString()
        };

        onSave(newUser);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Novo Usuário</h2>

                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded border border-red-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input name="name" type="text" required value={formData.name} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border" />
                    </div>

                    {/* SELECT DE PERFIL ROBUSTO */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Perfil de Acesso</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border bg-white"
                        >
                            <option value="sales">Consultor (Comercial)</option>
                            <option value="manager">Gestor (Gerente)</option>
                            <option value="financial">Financeiro</option>
                            <option value="pedagogico">Pedagógico</option>

                            {/* Opções restritas apenas para Master/Diretor */}
                            {isGlobalAdmin && (
                                <>
                                    <option value="franqueado">Franqueado (Dono)</option>
                                    <option value="diretor">Diretor</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Unidade</label>
                        <input
                            name="unit"
                            type="text"
                            required
                            readOnly={!isGlobalAdmin}
                            value={formData.unit}
                            onChange={handleChange}
                            placeholder="Ex: Brasilia.AsaSul"
                            className={`mt-1 block w-full rounded border-gray-300 shadow-sm p-2 border ${!isGlobalAdmin ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                        {isGlobalAdmin && <p className="text-xs text-gray-500 mt-1">Formato: Cidade.Bairro</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded font-medium">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterUser;
