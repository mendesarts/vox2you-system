import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Briefcase, Shield, ChevronDown } from 'lucide-react';

const RegisterUserFinal = ({ onClose, onSave, currentUser, userToEdit = null }) => {
    // 1. CORREÇÃO DE PERMISSÃO (Case Insensitive)
    // Converte para minúsculo para comparar, garantindo que 'Master' = 'master'
    const userRole = currentUser?.role?.toLowerCase() || '';
    const isGlobalAdmin = ['master', 'admin', 'diretor', 'director', 'franqueadora'].includes(userRole);
    const userHasUnit = currentUser?.unit && currentUser.unit !== 'Sem Unidade';

    // State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'consultor',
        unit: '',
        phone: ''
    });

    // Carrega dados
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
            // Se for Franqueado criando, herda a unidade
            if (!isGlobalAdmin && userHasUnit) {
                setFormData(prev => ({ ...prev, unit: currentUser.unit }));
            }
        }
    }, [userToEdit, isGlobalAdmin, userHasUnit, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.unit) return alert('Por favor, defina a Unidade.');
        const payload = { ...formData, id: userToEdit?.id };
        onSave(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 transition-all duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh] animate-fadeIn">

                {/* HEADER LIMPO */}
                <div className="bg-white dark:bg-gray-800 px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {userToEdit ? 'Editar Perfil' : 'Novo Cadastro'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <Shield size={14} className="text-indigo-600" />
                            Logado como: <span className="font-bold text-indigo-600 uppercase">{userRole}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* FORMULÁRIO */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Nome e Email */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400 font-medium"
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">Email Corporativo</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-400 font-bold">@</span>
                                <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                                    placeholder="joao@vox2you.com.br"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Cargo e Unidade */}
                    <div className="grid grid-cols-1 gap-5">

                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                <Briefcase size={16} className="text-indigo-500" /> Cargo / Função
                            </label>
                            <div className="relative">
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer font-medium shadow-sm">

                                    {/* SEÇÃO GLOBAL (Só aparece para Master/Diretor) */}
                                    {isGlobalAdmin && (
                                        <optgroup label="✨ Expansão (Global)">
                                            <option value="franqueado">Franqueado (Dono de Unidade)</option>
                                            <option value="diretor">Diretor Regional</option>
                                        </optgroup>
                                    )}

                                    <optgroup label="🏢 Gestão da Unidade">
                                        <option value="manager">Gestor da Unidade</option>
                                        <option value="lider_comercial">Líder Comercial</option>
                                        <option value="lider_pedagogico">Líder Pedagógico</option>
                                        <option value="admin_financeiro">Administrativo / Financeiro</option>
                                    </optgroup>

                                    <optgroup label="👥 Operacional">
                                        <option value="consultor">Consultor (Comercial)</option>
                                        <option value="pedagogico">Pedagógico (Professor)</option>
                                    </optgroup>
                                </select>
                                <ChevronDown className="absolute right-4 top-3.5 text-gray-400 pointer-events-none" size={18} />
                            </div>
                            {!isGlobalAdmin && <p className="text-xs text-gray-400 mt-1">Opções restritas ao nível da sua unidade.</p>}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                                <MapPin size={16} className="text-emerald-500" /> Unidade de Lotação
                            </label>
                            <input
                                required
                                readOnly={!isGlobalAdmin} // SÓ MASTER EDITA
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all font-medium ${!isGlobalAdmin
                                        ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 border-transparent cursor-not-allowed'
                                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white'
                                    }`}
                                placeholder={isGlobalAdmin ? "Digite a Unidade (ex: Brasília.AsaSul)" : "Unidade Vinculada"}
                            />
                        </div>
                    </div>

                    {/* FOOTER AÇÕES */}
                    <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl transition-all transform active:scale-95 flex items-center gap-2">
                            <Save size={18} />
                            {userToEdit ? 'Salvar Alterações' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUserFinal;
