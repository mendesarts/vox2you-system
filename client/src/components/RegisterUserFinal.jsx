import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

const RegisterUserFinal = ({ onClose, onSave, currentUser, userToEdit = null }) => {
    // Permissões
    const isGlobalAdmin = ['master', 'director', 'diretor', 'franqueadora'].includes(currentUser?.role);
    const userHasUnit = currentUser?.unit && currentUser.unit !== 'Sem Unidade';

    // State do Formulário
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'consultor',
        unit: '',
        phone: ''
    });

    // EFEITO 1: Carregar dados se for EDIÇÃO
    useEffect(() => {
        if (userToEdit) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                role: userToEdit.role || 'consultor',
                unit: userToEdit.unit || '', // Permite corrigir unidade na edição
                phone: userToEdit.phone || ''
            });
        } else {
            // Se for CRIAÇÃO, aplica a herança de unidade
            if (!isGlobalAdmin && userHasUnit) {
                setFormData(prev => ({ ...prev, unit: currentUser.unit }));
            }
        }
    }, [userToEdit, isGlobalAdmin, userHasUnit, currentUser]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.unit) return alert('ERRO: A Unidade é obrigatória.');

        // Prepara o objeto (Mantém o ID se for edição, cria novo se for criação)
        const payload = {
            ...formData,
            id: userToEdit ? userToEdit.id : undefined // Backend decide se cria ou atualiza
        };

        onSave(payload);
        onClose();
    };

    const inputStyle = "w-full h-12 px-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all";
    const labelStyle = "block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className={`px-6 py-4 flex justify-between items-center ${userToEdit ? 'bg-orange-600' : 'bg-indigo-600'}`}>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {userToEdit ? '✏️ EDITAR USUÁRIO' : '✨ NOVO MEMBRO'}
                    </h2>
                    <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

                    <div>
                        <label className={labelStyle}>Nome Completo</label>
                        <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className={inputStyle} placeholder="Nome do colaborador" />
                    </div>

                    <div>
                        <label className={labelStyle}>Email de Acesso</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className={inputStyle} placeholder="email@vox2you.com.br" />
                    </div>

                    {/* LISTA DE CARGOS COMPLETA (A PEDIDA PELO USUÁRIO) */}
                    <div>
                        <label className={labelStyle}>Cargo / Função</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={inputStyle}>
                            <optgroup label="Gestão da Unidade">
                                <option value="manager">Gestor da Unidade</option>
                                <option value="lider_comercial">Líder Comercial</option>
                                <option value="lider_pedagogico">Líder Pedagógico</option>
                                <option value="admin_financeiro">Administrativo / Financeiro</option>
                            </optgroup>
                            <optgroup label="Operacional">
                                <option value="consultor">Consultor (Comercial)</option>
                                <option value="pedagogico">Pedagógico (Professor)</option>
                            </optgroup>

                            {isGlobalAdmin && (
                                <optgroup label="Estratégico (Admin Global)">
                                    <option value="franqueado">⭐ Franqueado</option>
                                    <option value="diretor">👑 Diretor</option>
                                </optgroup>
                            )}
                        </select>
                    </div>

                    {/* UNIDADE (Travada para Franqueado, Aberta para Master) */}
                    <div>
                        <label className={labelStyle}>Unidade</label>
                        <input
                            required
                            // Só pode editar se for Master OU se estiver criando um usuário sem unidade definida ainda
                            readOnly={!isGlobalAdmin && (!userToEdit || userHasUnit)}
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            className={`${inputStyle} ${(!isGlobalAdmin) ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed' : ''}`}
                        />
                        {!isGlobalAdmin && <p className="text-xs text-gray-400 mt-1">Vinculado automaticamente à sua unidade.</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg font-bold bg-gray-200 text-gray-700 hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg flex items-center gap-2 ${userToEdit ? 'bg-orange-600 hover:bg-orange-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                            <Save size={18} />
                            {userToEdit ? 'Atualizar Dados' : 'Salvar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RegisterUserFinal;
