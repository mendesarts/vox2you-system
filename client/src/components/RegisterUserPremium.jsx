import React, { useState, useEffect } from 'react';
import { Save, User, MapPin, Briefcase, Shield, ChevronDown, Clock, Target, Users } from 'lucide-react';
import { VoxModal } from './VoxUI';
import ChangePasswordForm from './ChangePasswordForm';

const RegisterUserPremium = ({ onClose, onSave, currentUser, userToEdit = null }) => {
    const roleId = currentUser?.roleId || 0;
    const isMaster = roleId === 1;
    const isGlobalAdmin = [1, 10].includes(roleId);

    const canEditDetails = [1, 10, 20, 30].includes(Number(roleId));
    const isEditingSelf = userToEdit?.id === currentUser?.id;
    const isRestrictedView = !canEditDetails && userToEdit && !isEditingSelf;

    const DEFAULT_WEEK = {
        seg: { start: '09:00', end: '18:00', active: true },
        ter: { start: '09:00', end: '18:00', active: true },
        qua: { start: '09:00', end: '18:00', active: true },
        qui: { start: '09:00', end: '18:00', active: true },
        sex: { start: '09:00', end: '18:00', active: true },
        sab: { start: '09:00', end: '14:00', active: true },
        dom: { start: '', end: '', active: false }
    };

    const [formData, setFormData] = useState({
        name: '', email: '', role: 41, unit: '', phone: '',
        workingHours: DEFAULT_WEEK,
        canMentorship: false,
        goal: 10,
        secondaryRoles: []
    });

    useEffect(() => {
        if (userToEdit) {
            let wh = userToEdit.workingHours;
            if (wh && wh.start && !wh.seg) {
                wh = {
                    seg: { ...wh, active: true }, ter: { ...wh, active: true }, qua: { ...wh, active: true },
                    qui: { ...wh, active: true }, sex: { ...wh, active: true }, sab: { ...wh, active: true },
                    dom: { start: '', end: '', active: false }
                };
            }
            if (typeof wh === 'string') {
                try { wh = JSON.parse(wh); } catch { wh = DEFAULT_WEEK; }
            }

            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                role: userToEdit.roleId || 41,
                unit: userToEdit.unit || '',
                phone: userToEdit.phone || userToEdit.whatsapp || '',
                workingHours: wh || DEFAULT_WEEK,
                canMentorship: userToEdit.canMentorship !== undefined ? userToEdit.canMentorship : false,
                goal: userToEdit.goal || 10,
                secondaryRoles: (() => {
                    let roles = userToEdit.secondaryRoles;
                    if (typeof roles === 'string') {
                        try { roles = JSON.parse(roles); } catch (e) { roles = []; }
                    }
                    return Array.isArray(roles) ? roles.map(Number) : [];
                })()
            });
        } else {
            if (!isGlobalAdmin && currentUser?.unit) {
                setFormData(prev => ({ ...prev, unit: currentUser.unit || '' }));
            }
        }
    }, [userToEdit, isGlobalAdmin, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isRestrictedView) return;

        let finalUnit = formData.unit;
        if (!finalUnit) {
            if (currentUser?.unit && !isGlobalAdmin) finalUnit = currentUser.unit;
            else return alert('ERRO: A Unidade não foi definida.');
        }

        try {
            const payload = {
                ...formData,
                unit: finalUnit,
                unitName: finalUnit,
                id: userToEdit?.id
            };
            if (!userToEdit) payload.password = 'Vox2You@2025';

            await onSave(payload);
        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        }
    };

    const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
    const labelStyle = { fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.05em' };

    return (
        <VoxModal
            isOpen={true}
            onClose={onClose}
            title={userToEdit ? (isRestrictedView ? 'Meu Perfil' : 'Editar Usuário') : 'Novo Membro da Equipe'}
            width="900px"
            footer={
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={onClose} style={{ background: '#F2F2F7', border: 'none', padding: '12px 24px', borderRadius: '99px', fontWeight: '700', cursor: 'pointer' }}>
                        {isRestrictedView ? 'Fechar' : 'Cancelar'}
                    </button>
                    {(!isRestrictedView || isEditingSelf) && (
                        <button form="user-form" type="submit" className="btn-primary">
                            <Save size={18} /> {userToEdit ? 'Salvar Alterações' : 'Criar Usuário'}
                        </button>
                    )}
                </div>
            }
        >
            <form id="user-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Nome Completo */}
                <div style={inputGroupStyle}>
                    <label style={labelStyle}>Nome Completo</label>
                    <input
                        required
                        disabled={isRestrictedView}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: João Silva"
                    />
                </div>

                {/* Email e Cargo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Email Corporativo</label>
                        <input
                            required
                            type="email"
                            disabled={isRestrictedView}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="joao@vox2you.com"
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Cargo Principal</label>
                        <select
                            value={formData.role}
                            disabled={isRestrictedView || (userToEdit?.id === currentUser?.id)}
                            onChange={e => {
                                const newRole = parseInt(e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    role: newRole,
                                    unit: newRole === 10 ? 'Matriz' : prev.unit
                                }));
                            }}
                        >
                            {isMaster && (
                                <optgroup label="Global">
                                    <option value={1}>Master</option>
                                    <option value={10}>Diretor</option>
                                </optgroup>
                            )}
                            {(isGlobalAdmin || isRestrictedView || roleId === 20) && (
                                <optgroup label="Gestão da Franquia">
                                    <option value={20}>Franqueado</option>
                                </optgroup>
                            )}
                            <optgroup label="Unidade">
                                <option value={30}>Gestor</option>
                                <option value={40}>Líder Comercial</option>
                                <option value={50}>Líder Pedagógico</option>
                                <option value={41}>Consultor Comercial</option>
                                <option value={51}>Pedagógico</option>
                                <option value={61}>Administrativo</option>
                                <option value={60}>Financeiro</option>
                            </optgroup>
                        </select>
                    </div>
                </div>

                {/* Unidade e Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Unidade</label>
                        <input
                            readOnly={!isGlobalAdmin}
                            disabled={isRestrictedView}
                            value={formData.unit}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            style={{ background: !isGlobalAdmin ? '#F2F2F7' : '' }}
                            placeholder="Unidade..."
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Meta Mensal (Vendas)</label>
                        <input
                            type="number"
                            min="0"
                            disabled={isRestrictedView}
                            value={formData.goal}
                            onChange={e => setFormData({ ...formData, goal: e.target.value })}
                            placeholder="Ex: 10"
                        />
                    </div>
                </div>

                {/* Horários e Funções Secundárias */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>

                    {/* Horários */}
                    <div>
                        <label style={{ ...labelStyle, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} /> Horário Semanal
                        </label>
                        <div style={{ background: '#F2F2F7', padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { key: 'seg', label: 'Segunda' }, { key: 'ter', label: 'Terça' }, { key: 'qua', label: 'Quarta' },
                                { key: 'qui', label: 'Quinta' }, { key: 'sex', label: 'Sexta' }, { key: 'sab', label: 'Sábado' },
                                { key: 'dom', label: 'Domingo' }
                            ].map((day) => {
                                const dayConfig = formData.workingHours?.[day.key] || { start: '', end: '', active: false };
                                return (
                                    <div key={day.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                checked={dayConfig.active}
                                                disabled={isRestrictedView}
                                                onChange={(e) => {
                                                    const newWh = { ...formData.workingHours };
                                                    if (!newWh[day.key]) newWh[day.key] = {};
                                                    newWh[day.key] = { ...newWh[day.key], active: e.target.checked };
                                                    setFormData({ ...formData, workingHours: newWh });
                                                }}
                                                style={{ width: '16px', height: '16px', margin: 0 }}
                                            />
                                            <span style={{ fontSize: '13px', fontWeight: '700', color: dayConfig.active ? '#1C1C1E' : '#8E8E93' }}>{day.label}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: dayConfig.active ? 1 : 0.3 }}>
                                            <input
                                                type="time"
                                                value={dayConfig.start || ''}
                                                disabled={!dayConfig.active || isRestrictedView}
                                                onChange={(e) => {
                                                    const newWh = { ...formData.workingHours };
                                                    newWh[day.key] = { ...newWh[day.key], start: e.target.value };
                                                    setFormData({ ...formData, workingHours: newWh });
                                                }}
                                                style={{ padding: '6px', width: '90px', margin: 0 }}
                                            />
                                            <span style={{ fontSize: '11px', color: '#8E8E93' }}>às</span>
                                            <input
                                                type="time"
                                                value={dayConfig.end || ''}
                                                disabled={!dayConfig.active || isRestrictedView}
                                                onChange={(e) => {
                                                    const newWh = { ...formData.workingHours };
                                                    newWh[day.key] = { ...newWh[day.key], end: e.target.value };
                                                    setFormData({ ...formData, workingHours: newWh });
                                                }}
                                                style={{ padding: '6px', width: '90px', margin: 0 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Funções Secundárias */}
                    <div>
                        <label style={{ ...labelStyle, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={14} /> Acumular Funções
                        </label>
                        <div style={{ background: '#F2F2F7', padding: '16px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { id: 40, label: 'Líder Comercial' },
                                { id: 50, label: 'Líder Pedagógico' },
                                { id: 41, label: 'Consultor' },
                                { id: 51, label: 'Pedagógico' },
                                { id: 61, label: 'Administrativo' },
                                { id: 60, label: 'Financeiro' }
                            ].map((role) => (
                                <label key={role.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.secondaryRoles?.includes(role.id)}
                                        disabled={isRestrictedView}
                                        onChange={() => {
                                            if (isRestrictedView) return;
                                            const current = formData.secondaryRoles || [];
                                            if (current.includes(role.id)) {
                                                setFormData({ ...formData, secondaryRoles: current.filter(id => id !== role.id) });
                                            } else {
                                                setFormData({ ...formData, secondaryRoles: [...current, role.id] });
                                            }
                                        }}
                                        style={{ width: '18px', height: '18px', margin: 0 }}
                                    />
                                    {role.label}
                                </label>
                            ))}
                            <div style={{ margin: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '900', color: 'var(--ios-teal)' }}>
                                <input
                                    type="checkbox"
                                    checked={!!formData.canMentorship}
                                    disabled={isRestrictedView && !isMaster}
                                    onChange={e => setFormData({ ...formData, canMentorship: e.target.checked })}
                                    style={{ width: '18px', height: '18px', margin: 0 }}
                                />
                                Aplica Mentoria
                            </label>
                        </div>
                    </div>
                </div>

                {isRestrictedView && (
                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <ChangePasswordForm />
                    </div>
                )}
            </form>
        </VoxModal>
    );
};

export default RegisterUserPremium;
