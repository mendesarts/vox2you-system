import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const RegisterUserFinal = ({ onClose, onSave, currentUser }) => {
    const isGlobalAdmin = ['master', 'director', 'diretor', 'franqueadora'].includes(currentUser?.role);
    const [formData, setFormData] = useState({ name: '', email: '', role: 'sales', unit: '', phone: '' });

    useEffect(() => {
        if (!isGlobalAdmin) setFormData(prev => ({ ...prev, unit: currentUser?.unit || '' }));
    }, [currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.unit) return alert('ERRO: Unidade obrigatória!');

        const newUser = {
            id: Date.now().toString(),
            ...formData,
            password: Math.random().toString(36).slice(-8) + "1!",
            createdAt: new Date().toISOString(),
            avatar: null
        };
        onSave(newUser);
        onClose();
    };

    // ESTILOS DE EMERGÊNCIA (Inline para garantir visualização)
    const buttonStyle = { padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-indigo-500">

                {/* HEADER ROXO FORTE */}
                <div style={{ backgroundColor: '#4F46E5' }} className="px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">NOVO USUÁRIO (V.Final)</h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Nome</label>
                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-12 px-3 rounded border border-gray-400 dark:bg-gray-700 dark:text-white" placeholder="Nome Completo" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Email</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full h-12 px-3 rounded border border-gray-400 dark:bg-gray-700 dark:text-white" placeholder="email@exemplo.com" />
                    </div>

                    {/* PERFIL & UNIDADE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Perfil</label>
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full h-12 px-3 rounded border border-gray-400 dark:bg-gray-700 dark:text-white">
                                <option value="sales">Consultor</option>
                                <option value="manager">Gestor</option>
                                <option value="financial">Financeiro</option>
                                {isGlobalAdmin && <option value="franqueado">⭐ Franqueado</option>}
                                {isGlobalAdmin && <option value="diretor">👑 Diretor</option>}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">Unidade</label>
                            <input required readOnly={!isGlobalAdmin} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full h-12 px-3 rounded border border-gray-400 dark:bg-gray-700 dark:text-white bg-gray-50" />
                        </div>
                    </div>

                    {/* BOTÕES COM ESTILO INLINE (IMPOSSÍVEL NÃO MUDAR) */}
                    <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-gray-200">
                        <button type="button" onClick={onClose} style={{ ...buttonStyle, backgroundColor: '#E5E7EB', color: '#374151' }}>
                            CANCELAR
                        </button>
                        <button type="submit" style={{ ...buttonStyle, backgroundColor: '#4F46E5', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            SALVAR USUÁRIO
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUserFinal;
