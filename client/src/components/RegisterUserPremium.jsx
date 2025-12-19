import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Briefcase, Shield, ChevronDown, AlertCircle } from 'lucide-react';

const RegisterUserPremium = ({ onClose, onSave, currentUser, userToEdit = null }) => {
    // 1. DIAGNÓSTICO DE PERMISSÃO
    const rawRole = currentUser?.role || 'Indefinido';
    const userRole = rawRole.toLowerCase(); // Força minúsculo
    // Lista exata de quem manda no sistema
    const GOD_MODE_ROLES = ['master', 'admin', 'diretor', 'director', 'franqueadora'];
    const isGlobalAdmin = GOD_MODE_ROLES.includes(userRole);
    const userHasUnit = currentUser?.unit && currentUser.unit !== 'Sem Unidade';

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
        } else if (!isGlobalAdmin && userHasUnit) {
            setFormData(prev => ({ ...prev, unit: currentUser.unit }));
        }
    }, [userToEdit, isGlobalAdmin, userHasUnit, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.unit) return alert('ERRO: A Unidade é obrigatória.');
        onSave({ ...formData, id: userToEdit?.id });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">

                {/* BARRA DE DEBUG (Removeremos depois) */}
                <div className="bg-yellow-100 text-yellow-800 text-xs px-4 py-1 flex justify-between">
                    <span>🛡️ Cargo Detectado: <strong>{rawRole}</strong></span>
                    <span>Acesso Global: <strong>{isGlobalAdmin ? 'SIM ✅' : 'NÃO ❌'}</strong></span>
                </div>

                {/* HEADER */}
                <div className="px-8 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {userToEdit ? 'Editar Usuário' : 'Novo Cadastro'}
                        </h2>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mt-1 text-indigo-600">
                            V.PREMIUM (Atualizado)
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto">
                    {/* NOME & EMAIL */}
                    <div className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                                placeholder="Nome Completo" />
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-400 font-bold">@</span>
                            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                                placeholder="Email Corporativo" />
                        </div>
                    </div>

                    {/* SELECTOR DE CARGO */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1.5 block">Cargo / Função</label>
                        <div className="relative">
                            <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 outline-none appearance-none font-medium cursor-pointer shadow-sm">

                                {/* LÓGICA: Se for Admin Global, MOSTRA TUDO. Se não, esconde Franqueado. */}
                                {isGlobalAdmin && (
                                    <optgroup label="✨ Expansão (Global)">
                                        <option value="franqueado">⭐ Franqueado (Dono)</option>
                                        <option value="diretor">👑 Diretor</option>
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

                        {/* ALERTA VISUAL SE A OPÇÃO ESTIVER OCULTA */}
                        {!isGlobalAdmin && (
                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                <AlertCircle size={12} /> Opções de Franqueado ocultas (Nível de acesso insuficiente)
                            </p>
                        )}
                    </div>

                    {/* UNIDADE */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1.5 block">Unidade</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-3.5 text-gray-400" size={18} />
                            <input required readOnly={!isGlobalAdmin} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none font-medium ${!isGlobalAdmin ? 'bg-gray-100 text-gray-500 border-transparent' : 'bg-white border-gray-200 focus:border-indigo-500'}`}
                                placeholder={isGlobalAdmin ? "Digite a Unidade..." : "Unidade Vinculada"} />
                        </div>
                    </div>

                    {/* BOTÕES */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" className="px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                            {userToEdit ? 'Salvar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUserPremium;
