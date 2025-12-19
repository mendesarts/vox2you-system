import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Briefcase, Shield, ChevronDown } from 'lucide-react';

const RegisterUserPremium = ({ onClose, onSave, currentUser, userToEdit = null }) => {
    const userRole = currentUser?.role?.toLowerCase() || '';
    const isGlobalAdmin = ['master', 'admin', 'diretor', 'director', 'franqueadora'].includes(userRole);

    // State
    const [formData, setFormData] = useState({
        name: '', email: '', role: 'consultor', unit: '', phone: ''
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                role: userToEdit.role?.toLowerCase() || 'consultor',
                unit: userToEdit.unit || '',
                phone: userToEdit.phone || ''
            });
        } else {
            // CRIAÇÃO: Herança IMEDIATA da unidade
            if (!isGlobalAdmin && currentUser?.unit) {
                setFormData(prev => ({ ...prev, unit: currentUser.unit }));
            }
        }
    }, [userToEdit, isGlobalAdmin, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validação extra
        if (!formData.unit) {
            // Tenta recuperar do usuário logado se o campo estiver vazio
            if (currentUser?.unit && !isGlobalAdmin) {
                onSave({ ...formData, unit: currentUser.unit, id: userToEdit?.id });
                onClose();
                return;
            }
            return alert('ERRO: A Unidade não foi definida.');
        }

        onSave({ ...formData, id: userToEdit?.id });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-gray-800">
                        {userToEdit ? 'Editar Usuário' : 'Novo Membro da Equipe'}
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">Nome</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="Nome completo" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-700 block mb-1">Email</label>
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none" placeholder="email@vox.com" />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">Cargo</label>
                        <div className="relative">
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white outline-none appearance-none cursor-pointer">
                                {isGlobalAdmin && (
                                    <optgroup label="Global">
                                        <option value="franqueado">Franqueado</option>
                                        <option value="diretor">Diretor</option>
                                    </optgroup>
                                )}
                                <optgroup label="Unidade">
                                    <option value="manager">Gestor</option>
                                    <option value="lider_comercial">Líder Comercial</option>
                                    <option value="consultor">Consultor</option>
                                    <option value="pedagogico">Pedagógico</option>
                                    <option value="admin_financeiro">Financeiro</option>
                                </optgroup>
                            </select>
                            <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">Unidade</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            {/* INPUT INTELIGENTE: Se for admin, digita. Se for franqueado, MOSTRA o valor travado. */}
                            <input
                                required
                                readOnly={!isGlobalAdmin}
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium ${!isGlobalAdmin
                                        ? 'bg-gray-100 text-gray-600 border-gray-200' // Visual Travado Claro
                                        : 'bg-white border-gray-200 focus:border-indigo-500'
                                    }`}
                                placeholder="Unidade..."
                            />
                        </div>
                        {!isGlobalAdmin && (
                            <p className="text-xs text-gray-500 mt-1 ml-1">
                                🔒 Vinculado à unidade: <strong>{currentUser?.unit || 'Carregando...'}</strong>
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg">
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUserPremium;
