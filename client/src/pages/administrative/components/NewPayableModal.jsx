import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Save, Trash, Power, CheckCircle } from 'lucide-react';
import SettlePayableModal from './SettlePayableModal';
import RecurringActionModal from './RecurringActionModal';

const NewPayableModal = ({ onClose, onSuccess, onRefresh, scope = 'business', editRecord = null }) => {
    const [activeTab, setActiveTab] = useState('dados');
    const [showSuccess, setShowSuccess] = useState(false);
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [createdRecordForSettle, setCreatedRecordForSettle] = useState(null);
    const [showPlanConfirmModal, setShowPlanConfirmModal] = useState(false);

    // Recurring Action Modal
    const [showRecurringDeleteModal, setShowRecurringDeleteModal] = useState(false);

    // Initial Data
    const initialData = {
        destinationType: 'cliente',
        destinationName: '',
        docNumber: '',
        entryDate: new Date().toISOString().split('T')[0],
        competence: new Date().toISOString().slice(0, 7),
        installmentValue: 'R$ 0,00',
        installmentsCount: 1,
        totalValue: 'R$ 0,00',
        dueDay: '1',
        dueMonth: 'Fevereiro',
        dueYear: '2026',
        category: 'CONTA GENÉRICA',
        complement: '',
        description: '',
        paymentMethod: '',
        debitAccount: 'caixa',
        dailyInterest: '0',
        payFirstOnLaunch: false,
        launchType: 'unico',
        periodicity: 'mensal'
    };

    // Form State
    const [formData, setFormData] = useState(initialData);

    // Populate for Edit
    useEffect(() => {
        if (editRecord) {
            const [y, m, d] = (editRecord.dueDate || '').split('-').map(Number);
            const date = new Date(y, m - 1, d, 12, 0, 0);
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

            setFormData(prev => ({
                ...prev,
                description: (editRecord.description || '').replace(/\s\(\d+\/\d+\)$/, ''),
                category: editRecord.category || '',
                destinationName: (editRecord.description || '').split(' - ')[0] || '',
                complement: '',
                installmentsCount: editRecord.installments || 1,
                installmentValue: 'R$ ' + (editRecord.amount || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }),
                totalValue: 'R$ ' + ((editRecord.amount || 0) * (editRecord.installments || 1)).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }),
                dueDay: String(date.getDate()),
                dueMonth: monthNames[date.getMonth()],
                dueYear: String(date.getFullYear()),
                payFirstOnLaunch: editRecord.status === 'paid',
                paymentMethod: editRecord.paymentMethod || 'boleto',
                debitAccount: editRecord.debitAccount || '',
                launchType: editRecord.launchType || 'unico',
                periodicity: editRecord.periodicity || 'mensal'
            }));
        }
    }, [editRecord]);

    const handleReset = () => {
        setFormData(initialData);
        setShowSuccess(false);
        setActiveTab('dados');
    };

    // Formatar valor como moeda brasileira
    const formatCurrency = (value) => {
        // Remove tudo exceto números
        const numbers = value.replace(/\D/g, '');

        // Se vazio, retorna 0,00
        if (!numbers) return 'R$ 0,00';

        // Converte para número e divide por 100 (centavos)
        const amount = parseInt(numbers) / 100;

        // Formata como moeda brasileira
        return 'R$ ' + amount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Parse moeda para número
    const parseCurrency = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (!numbers) return '0,00';
        const amount = parseInt(numbers) / 100;
        return amount.toFixed(2).replace('.', ',');
    };

    // Handle Amount Change with Currency Mask
    const handleAmountChange = (field, value) => {
        const formatted = formatCurrency(value);
        const parsed = parseCurrency(value);

        setFormData(prev => {
            const newState = { ...prev, [field]: formatted };

            if (field === 'installmentValue') {
                const count = Number(prev.installmentsCount) || 1;
                const val = parseFloat(parsed.replace(',', '.'));
                const total = (val * count).toFixed(2).replace('.', ',');
                newState.totalValue = 'R$ ' + parseFloat(total.replace(',', '.')).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
            return newState;
        });
    };

    // Auto-calc Total if Installment Count changes
    const handleCountChange = (value) => {
        setFormData(prev => {
            const count = Number(value) || 1;
            const val = parseFloat(prev.installmentValue.replace(',', '.'));
            const total = (val * count).toFixed(2).replace('.', ',');
            return { ...prev, installmentsCount: value, totalValue: total };
        });
    };

    // Auto-Categorization Logic
    const CATEGORY_KEYWORDS = {
        'energia': 'ENERGIA ELÉTRICA', 'luz': 'ENERGIA ELÉTRICA', 'cemig': 'ENERGIA ELÉTRICA', 'cpfl': 'ENERGIA ELÉTRICA', 'enel': 'ENERGIA ELÉTRICA',
        'agua': 'ÁGUA', 'água': 'ÁGUA', 'sabesp': 'ÁGUA', 'saneago': 'ÁGUA',
        'internet': 'TELEFONIA & INTERNET', 'telefone': 'TELEFONIA & INTERNET', 'vivo': 'TELEFONIA & INTERNET', 'claro': 'TELEFONIA & INTERNET', 'tim': 'TELEFONIA & INTERNET', 'oi': 'TELEFONIA & INTERNET',
        'aluguel': 'ALUGUEL & TAXAS', 'condominio': 'ALUGUEL & TAXAS', 'iptu': 'ALUGUEL & TAXAS',
        'limpeza': 'EQUIPE DE LIMPEZA', 'faxina': 'EQUIPE DE LIMPEZA',
        'seguranca': 'SEGURANÇA', 'alarme': 'SEGURANÇA',
        'salario': 'EQUIPE ADMINISTRATIVA', 'folha': 'ENCARGOS & BENEFÍCIOS & PROVISÕES', 'inss': 'ENCARGOS & BENEFÍCIOS & PROVISÕES', 'fgts': 'ENCARGOS & BENEFÍCIOS & PROVISÕES',
        'comissao': 'EQUIPE COMERCIAL', 'bonus': 'BONIFICAÇÕES & ENDOMARKETING',
        'facebook': 'MARKETING DIGITAL', 'instagram': 'MARKETING DIGITAL', 'google': 'MARKETING DIGITAL', 'ads': 'MARKETING DIGITAL', 'trafego': 'MARKETING DIGITAL',
        'grafica': 'MARKETING OFFLINE', 'panfleto': 'MARKETING OFFLINE', 'outdoor': 'MARKETING OFFLINE',
        'evento': 'EVENTOS', 'palestra': 'EVENTOS',
        'contador': 'CONTABILIDADE', 'contabilidade': 'CONTABILIDADE',
        'sistema': 'SISTEMAS', 'software': 'SISTEMAS',
        'papelaria': 'MATERIAL LIMPEZA & ESCRITÓRIO', 'kalunga': 'MATERIAL LIMPEZA & ESCRITÓRIO',
        'didatico': 'MATERIAL DIDÁTICO', 'livro': 'MATERIAL DIDÁTICO', 'apostila': 'MATERIAL DIDÁTICO',
        'cafe': 'COFFEE BREAK', 'lanche': 'COFFEE BREAK', 'supermercado': 'COFFEE BREAK'
    };

    // Month Mapping
    const MONTH_MAP = {
        'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04', 'Maio': '05', 'Junho': '06',
        'Julho': '07', 'Agosto': '08', 'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12'
    };

    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        // Validation
        if (!formData.category) return alert('Selecione uma categoria.');
        if (!formData.totalValue || formData.totalValue === 'R$ 0,00' || formData.totalValue === '0,00') return alert('Informe o valor.');


        // Plan Update Logic Check - Para recorrências, excluir e recriar
        if (editRecord && editRecord.planId) {
            // Extrair valores atuais
            const currentVal = parseFloat(formData.installmentValue.replace(/[R$\s.]/g, '').replace(',', '.'));
            const currentPeriodicity = formData.periodicity;
            const currentCategory = formData.category;
            const currentDescription = formData.description;
            const currentDueDay = formData.dueDay;
            const currentDueMonth = formData.dueMonth;
            const currentDueYear = formData.dueYear;

            // Extrair valores originais
            const originalVal = parseFloat(editRecord.amount || 0);
            const originalPeriodicity = editRecord.periodicity;
            const originalCategory = editRecord.category;
            const originalDescription = (editRecord.description || '').replace(/\s\(\d+\/\d+\)$/, '');

            // Data original
            const [origY, origM, origD] = (editRecord.dueDate || '').split('-').map(Number);
            const origDate = new Date(origY, origM - 1, origD);
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const originalDueDay = String(origDate.getDate());
            const originalDueMonth = monthNames[origDate.getMonth()];
            const originalDueYear = String(origDate.getFullYear());

            // Detectar se houve QUALQUER mudança
            const hasChanges =
                Math.abs(currentVal - originalVal) > 0.01 ||
                currentPeriodicity !== originalPeriodicity ||
                currentCategory !== originalCategory ||
                currentDescription !== originalDescription ||
                currentDueDay !== originalDueDay ||
                currentDueMonth !== originalDueMonth ||
                currentDueYear !== originalDueYear;

            if (hasChanges) {
                const confirmRecreate = window.confirm(
                    'Detectamos alterações nesta recorrência.\n\n' +
                    'Para aplicar as mudanças, vamos EXCLUIR esta e todas as FUTURAS parcelas e RECRIAR com os novos valores.\n' +
                    'As parcelas PASSADAS não serão afetadas.\n\n' +
                    'Deseja continuar?'
                );

                if (!confirmRecreate) return;

                // Executar delete + recreate
                await deleteAndRecreate();
                return;
            }
        }

        executeSave(false);
    };

    const deleteAndRecreate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Excluir esta e futuras
            const deleteUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${editRecord.id}?deleteFutures=true`;
            const deleteRes = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!deleteRes.ok) {
                throw new Error('Erro ao excluir registros antigos');
            }

            // 2. Criar nova recorrência
            await executeSave(false, true); // true = forceCreate

        } catch (error) {
            console.error(error);
            alert('Erro ao recriar recorrência: ' + error.message);
            setLoading(false);
        }
    };

    const executeSave = async (updatePlanBoolean, forceCreate = false) => {
        setLoading(true);
        try {
            // Format Date
            const month = MONTH_MAP[formData.dueMonth] || '01';
            const day = formData.dueDay.padStart(2, '0');
            const dueDateStr = `${formData.dueYear}-${month}-${day}`;


            // Installments Logic based on launchType
            let finalInstallments = parseInt(formData.installmentsCount) || 1;
            let finalAmount = parseFloat(formData.totalValue.replace(/[R$\s.]/g, '').replace(',', '.'));

            // Lógica diferente para CRIAÇÃO vs EDIÇÃO
            if (editRecord && !forceCreate) {
                // MODO EDIÇÃO (sem forceCreate): enviar apenas o valor da parcela individual
                finalAmount = parseFloat(formData.installmentValue.replace(/[R$\s.]/g, '').replace(',', '.'));
                // Não recalcular installments - manter o que já existe
                finalInstallments = editRecord.installments || 1;
            } else {
                // MODO CRIAÇÃO ou RECREATE: usar valor da parcela e calcular parcelas
                if (formData.launchType === 'unico') {
                    finalInstallments = 1;
                    finalAmount = parseFloat(formData.installmentValue.replace(/[R$\s.]/g, '').replace(',', '.'));
                } else if (formData.launchType === 'recorrente') {
                    const p = formData.periodicity;
                    // Calculate iterations to cover ~1 year
                    if (p === 'diaria') finalInstallments = 365;
                    else if (p === 'semanal') finalInstallments = 52;
                    else if (p === 'quinzenal') finalInstallments = 24;
                    else if (p === 'mensal') finalInstallments = 12;
                    else if (p === 'bimestral') finalInstallments = 6;
                    else if (p === 'trimestral') finalInstallments = 4;
                    else if (p === 'semestral') finalInstallments = 2;
                    else if (p === 'anual') finalInstallments = 1;
                    else finalInstallments = 12;

                    // Enviar apenas o valor da parcela individual (backend vai replicar)
                    finalAmount = parseFloat(formData.installmentValue.replace(/[R$\s.]/g, '').replace(',', '.'));
                } else {
                    // Parcelado: usar valor total
                    finalAmount = parseFloat(formData.totalValue.replace(/[R$\s.]/g, '').replace(',', '.'));
                }
            }

            // Prepare Payload
            const payload = {
                type: 'outros',
                direction: 'expense',
                scope: scope,
                category: formData.category,
                description: editRecord
                    ? formData.description
                    : (() => {
                        const parts = [];
                        if (formData.destinationName && formData.destinationName.trim()) {
                            parts.push(formData.destinationName.trim());
                        }
                        if (formData.description && formData.description.trim()) {
                            parts.push(formData.description.trim());
                        }
                        let result = parts.join(' - ');
                        if (formData.complement && formData.complement.trim()) {
                            result += ` (${formData.complement.trim()})`;
                        }
                        return result || 'Sem descrição';
                    })(),
                amount: finalAmount,
                dueDate: dueDateStr,
                status: 'pending', // Always pending to allow Settle Modal to finalize it
                paymentMethod: 'boleto', // Default or from form
                installments: finalInstallments,
                launchType: formData.launchType,
                periodicity: formData.periodicity,
                updatePlan: updatePlanBoolean
            };


            const token = localStorage.getItem('token');
            const url = (editRecord && !forceCreate)
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${editRecord.id}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/record`;

            const method = (editRecord && !forceCreate) ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const resData = await res.json();
                if (formData.payFirstOnLaunch) {
                    setCreatedRecordForSettle(resData);
                    setShowSettleModal(true);
                } else {
                    setShowSuccess(true);
                    if (onRefresh) onRefresh();
                }
            } else {
                const err = await res.json();
                alert('Erro ao salvar: ' + (err.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao salvar.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!editRecord) return;

        const isRecurring = editRecord.launchType === 'recorrente';
        const isInstallment = editRecord.installments > 1;

        console.log('🔍 handleDelete DEBUG:', {
            editRecord,
            isRecurring,
            isInstallment,
            planId: editRecord.planId,
            shouldShowModal: isRecurring || isInstallment
        });

        // Sempre mostrar o modal de confirmação (UI consistente)
        console.log('✅ Mostrando RecurringDeleteModal');
        setShowRecurringDeleteModal(true);
    };

    const executeDelete = async (deleteScope) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${editRecord.id}?deleteScope=${deleteScope}`;
            const res = await fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                if (onRefresh) onRefresh();
                onClose();
            } else {
                const err = await res.json();
                alert('Erro ao excluir: ' + (err.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao excluir.');
        } finally {
            setLoading(false);
        }
    };

    const handleAutoCategory = (text) => {
        if (!text || formData.category) return; // Don't overwrite if already selected

        const lowerText = text.toLowerCase();
        for (const [key, category] of Object.entries(CATEGORY_KEYWORDS)) {
            if (lowerText.includes(key)) {
                setFormData(prev => ({ ...prev, category }));
                break; // Stop on first match
            }
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                width: '800px',
                maxWidth: '95vw',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
                fontFamily: 'Arial, sans-serif',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: '#7e22ce', // Purple header
                    padding: '10px 16px',
                    color: 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>Nova Conta a Pagar</span>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '10px 16px 0',
                    backgroundColor: '#f8fafc'
                }}>
                    {['Dados do Plano', 'Parcelas', 'Observações'].map(tab => {
                        const id = tab.toLowerCase().split(' ')[0];
                        return (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    background: activeTab === id ? '#7e22ce' : 'transparent',
                                    color: activeTab === id ? 'white' : '#64748b',
                                    fontWeight: 'bold',
                                    borderRadius: '8px 8px 0 0',
                                    cursor: 'pointer',
                                    marginRight: '4px',
                                    fontSize: '13px'
                                }}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                {/* Form Content */}
                <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '70vh' }}>

                    {/* DESTINATION SECTION */}
                    <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                        <legend style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '0 4px' }}>Destino</legend>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px', fontSize: '13px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input type="radio" checked={formData.destinationType === 'aluno'} onChange={() => setFormData({ ...formData, destinationType: 'aluno' })} /> Aluno
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: '#2563eb' }}>
                                <input type="radio" checked={formData.destinationType === 'cliente'} onChange={() => setFormData({ ...formData, destinationType: 'cliente' })} /> Cliente/Fornecedor
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input type="radio" checked={formData.destinationType === 'funcionario'} onChange={() => setFormData({ ...formData, destinationType: 'funcionario' })} /> Funcionário <span style={{ color: 'red' }}>*</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 2, display: 'flex', gap: '6px' }}>
                                <input
                                    type="text"
                                    style={{ flex: 1, padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                                    placeholder="Nome do Fornecedor/Cliente/Funcionário"
                                    value={formData.destinationName}
                                    onChange={(e) => setFormData({ ...formData, destinationName: e.target.value })}
                                    onBlur={(e) => handleAutoCategory(e.target.value)}
                                />

                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Nº do Documento</label>
                                <input type="text" className="input-field" value={formData.docNumber} onChange={e => setFormData({ ...formData, docNumber: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>

                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Data entrada</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={new Date(formData.entryDate).toLocaleDateString('pt-BR')} readOnly style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', paddingRight: '25px' }} />
                                    <Calendar size={14} color="#7e22ce" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>

                            <div style={{ flex: 0.8 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Competência</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="text" value={formData.competence} onChange={e => setFormData({ ...formData, competence: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                    <Calendar size={14} color="#7e22ce" style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }} />
                                </div>
                            </div>
                        </div>
                    </fieldset>

                    {/* VALUES & DUE DATE ROW */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        {/* Values Section */}
                        <fieldset style={{ flex: 1.5, border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px' }}>
                            <legend style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '0 4px' }}>Valores e Tipo</legend>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Tipo de Lançamento</label>
                                    <select
                                        value={formData.launchType}
                                        onChange={e => {
                                            const newType = e.target.value;
                                            setFormData(prev => ({
                                                ...prev,
                                                launchType: newType,
                                                installmentsCount: newType === 'unico' ? 1 : (prev.installmentsCount > 1 ? prev.installmentsCount : 2), // Default to 2 if switching to installments
                                                // Recalculate Total if needed happens in render or validation, but let's sync state if needed
                                                totalValue: newType === 'unico' ? prev.installmentValue : prev.totalValue
                                            }));
                                        }}
                                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
                                    >
                                        <option value="unico">Conta Única</option>
                                        <option value="parcelado">Parcelado</option>
                                        <option value="recorrente">Conta Recorrente</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                                        {formData.launchType === 'unico' ? 'Valor' : 'Valor Parcela'} <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input type="text" value={formData.installmentValue} onChange={e => handleAmountChange('installmentValue', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {formData.launchType === 'parcelado' && (
                                    <div style={{ flex: 0.8 }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Nº de Parcelas <span style={{ color: 'red' }}>*</span></label>
                                        <input type="number" value={formData.installmentsCount} onChange={e => handleCountChange(e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                    </div>
                                )}
                                {formData.launchType === 'recorrente' && (
                                    <div style={{ flex: 0.8 }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Recorrência</label>
                                        <select
                                            value={formData.periodicity}
                                            onChange={e => setFormData({ ...formData, periodicity: e.target.value })}
                                            style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
                                        >
                                            <option value="diaria">Diária</option>
                                            <option value="semanal">Semanal</option>
                                            <option value="quinzenal">Quinzenal</option>
                                            <option value="mensal">Mensal</option>
                                            <option value="bimestral">Bimestral</option>
                                            <option value="trimestral">Trimestral</option>
                                            <option value="semestral">Semestral</option>
                                            <option value="anual">Anual</option>
                                        </select>
                                    </div>
                                )}
                                {formData.launchType !== 'recorrente' && formData.launchType !== 'unico' && (
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Valor Total</label>
                                        <input type="text" value={formData.totalValue} readOnly style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#f8fafc' }} />
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        {/* Due Date Section */}
                        <fieldset style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px' }}>
                            <legend style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '0 4px' }}>Vencimento</legend>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ flex: 0.6 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Dia <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={formData.dueDay} onChange={e => setFormData({ ...formData, dueDay: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                                <div style={{ flex: 1.5 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Mês <span style={{ color: 'red' }}>*</span></label>
                                    <select
                                        value={formData.dueMonth}
                                        onChange={(e) => setFormData({ ...formData, dueMonth: e.target.value })}
                                        style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
                                    >
                                        {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Ano <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" value={formData.dueYear} onChange={e => setFormData({ ...formData, dueYear: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                                </div>
                            </div>
                        </fieldset>
                    </div>

                    {/* ACCOUNT PLAN SECTION */}
                    <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px' }}>
                        <legend style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '0 4px' }}>Plano de Contas</legend>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Categoria <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
                                >
                                    <option value="">(Selecione)</option>
                                    <optgroup label="Custo do Serviço Prestado">
                                        <option value="COFFEE BREAK">Coffee Break</option>
                                        <option value="FACILITADOR EXTERNO">Facilitador Externo</option>
                                        <option value="LOCAL DE APLICAÇÃO DOS CURSOS">Local de Aplicação</option>
                                        <option value="MATERIAL DIDÁTICO">Material Didático</option>
                                    </optgroup>
                                    <optgroup label="Despesas Variáveis">
                                        <option value="IMPOSTOS">Impostos</option>
                                        <option value="DEVOLUÇÕES/ CANCELAMENTO">Devoluções/Cancelamento</option>
                                        <option value="COMISSÃO/ MATRÍCULA">Comissão/Matrícula</option>
                                        <option value="TAXA DE CARTÕES">Taxa de Cartões</option>
                                        <option value="ROYALTIES">Royalties</option>
                                    </optgroup>
                                    <optgroup label="Despesas Administrativas (Pessoal)">
                                        <option value="EQUIPE COMERCIAL">Equipe Comercial</option>
                                        <option value="EQUIPE ADMINISTRATIVA">Equipe Administrativa</option>
                                        <option value="EQUIPE PEDAGÓGICA">Equipe Pedagógica</option>
                                        <option value="ENCARGOS & BENEFÍCIOS & PROVISÕES">Encargos & Benefícios</option>
                                        <option value="BONIFICAÇÕES & ENDOMARKETING">Bonificações & Endomarketing</option>
                                        <option value="PRÓ-LABORE">Pró-Labore</option>
                                        <option value="FRANQUEADO">Franqueado</option>
                                    </optgroup>
                                    <optgroup label="Ocupação">
                                        <option value="ALUGUEL & TAXAS">Aluguel & Taxas</option>
                                        <option value="TELEFONIA & INTERNET">Telefonia & Internet</option>
                                        <option value="ENERGIA ELÉTRICA">Energia Elétrica</option>
                                        <option value="ÁGUA">Água</option>
                                        <option value="EQUIPE DE LIMPEZA">Equipe de Limpeza</option>
                                        <option value="SEGURANÇA">Segurança</option>
                                    </optgroup>
                                    <optgroup label="Serviços de Terceiros">
                                        <option value="CONTABILIDADE">Contabilidade</option>
                                        <option value="SISTEMAS">Sistemas</option>
                                        <option value="OUTROS SERVIÇOS">Outros Serviços</option>
                                    </optgroup>
                                    <optgroup label="Marketing">
                                        <option value="AGENCIA PARCEIRA">Agência Parceira</option>
                                        <option value="MARKETING DIGITAL">Marketing Digital</option>
                                        <option value="MARKETING OFFLINE">Marketing Offline</option>
                                        <option value="EVENTOS">Eventos</option>
                                        <option value="OUTRAS AÇÕES E SERVIÇOS">Outras Ações</option>
                                    </optgroup>
                                    <optgroup label="Despesas Financeiras">
                                        <option value="TARIFAS BANCÁRIAS">Tarifas Bancárias</option>
                                    </optgroup>
                                    <optgroup label="Despesas Adm. Gerais">
                                        <option value="MATERIAL LIMPEZA & ESCRITÓRIO">Material Limpeza & Escritório</option>
                                        <option value="MANUTENÇÃO UNIDADE">Manutenção Unidade</option>
                                        <option value="TREINAMENTOS E VIAGENS">Treinamentos e Viagens</option>
                                        <option value="OUTRAS DESPESAS">Outras Despesas</option>
                                    </optgroup>
                                    <optgroup label="Outros">
                                        <option value="DÍVIDAS">Dívidas</option>
                                        <option value="INVESTIMENTOS">Investimentos</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div style={{ flex: 1.5 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Complemento</label>
                                <input
                                    type="text"
                                    value={formData.complement}
                                    onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    onBlur={(e) => handleAutoCategory(e.target.value)}
                                />
                            </div>
                            <div style={{ flex: 1.5 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Descrição</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                                    onBlur={(e) => handleAutoCategory(e.target.value)}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* BILLING SECTION */}
                    <fieldset style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 14px' }}>
                        <legend style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', padding: '0 4px' }}>Cobrança</legend>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Forma de Cobrança <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    value={formData.paymentMethod}
                                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
                                >
                                    <option value="">(Selecione)</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="cartao_credito">Cartão de Crédito</option>
                                    <option value="cartao_debito">Cartão de Débito</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="automatic_debit">Débito Automático</option>
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="pix">Pix</option>
                                    <option value="recorrencia">Recorrência</option>
                                    <option value="transferencia">Transferência</option>
                                </select>
                                <label style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    fontSize: '9px',
                                    color: '#64748b',
                                    marginTop: '4px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    padding: 0,
                                    margin: '4px 0 0 0'
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.payFirstOnLaunch}
                                        onChange={e => setFormData({ ...formData, payFirstOnLaunch: e.target.checked })}
                                        style={{ cursor: 'pointer', margin: 0, padding: 0, width: '12px', height: '12px' }}
                                    />
                                    <span style={{ margin: 0, padding: 0 }}>QUITAR A 1ª PARCELA AO LANÇAR</span>
                                </label>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Conta a debitar</label>
                                <select
                                    value={formData.debitAccount}
                                    onChange={(e) => setFormData({ ...formData, debitAccount: e.target.value })}
                                    style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white' }}
                                >
                                    <option value="caixa">Caixa Geral</option>
                                </select>
                            </div>
                            <div style={{ flex: 0.5 }}>
                                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Mora Diária(%)</label>
                                <input type="text" value={formData.dailyInterest} onChange={e => setFormData({ ...formData, dailyInterest: e.target.value })} style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
                            </div>
                        </div>
                    </fieldset>
                </div>

                {/* Footer Buttons */}
                <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #e5e7eb',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                backgroundColor: loading ? '#9ca3af' : '#10b981', color: 'white', border: 'none',
                                padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', fontSize: '13px'
                            }}>
                            <span style={{ fontWeight: '900' }}>{loading ? '...' : '✓'}</span> {loading ? 'Salvando...' : 'Salvar'}
                        </button>



                        {editRecord && (
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    backgroundColor: 'white', color: '#ef4444', border: '1px solid #ef4444',
                                    padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'wait' : 'pointer', fontSize: '13px'
                                }}
                            >
                                <Trash size={16} /> Excluir Plano
                            </button>
                        )}
                    </div>

                    <button onClick={onClose} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        backgroundColor: 'white', color: '#ef4444', border: '1px solid #ef4444',
                        padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
                    }}>
                        <Power size={16} /> Sair
                    </button>
                </div>
                {/* Success Popup Overlay */}
                {
                    showSuccess && (
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            zIndex: 10
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <CheckCircle size={64} color="#10b981" style={{ marginBottom: '16px' }} />
                                <h2 style={{ fontSize: '24px', color: '#10b981', margin: '0 0 8px 0' }}>Registrado com Sucesso!</h2>
                                <p style={{ color: '#64748b', marginBottom: '32px' }}>O lançamento foi salvo no sistema.</p>

                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button
                                        onClick={handleReset}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#7e22ce',
                                            color: 'white',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        <Plus size={18} /> Novo Lançamento
                                    </button>

                                    <button
                                        onClick={onSuccess}
                                        style={{
                                            padding: '12px 24px',
                                            borderRadius: '8px',
                                            border: '1px solid #cbd5e1',
                                            backgroundColor: 'white',
                                            color: '#64748b',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Sair
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >

            {showPlanConfirmModal && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ marginTop: 0, color: '#1e293b' }}>Alteração de Valor</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                            Você alterou o valor de um lançamento recorrente/parcelado.
                            Deseja aplicar esta alteração para <b>todos</b> os lançamentos futuros ou <b>apenas este</b>?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button
                                onClick={() => { setShowPlanConfirmModal(false); executeSave(false); }}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Apenas Este
                            </button>
                            <button
                                onClick={() => { setShowPlanConfirmModal(false); executeSave(true); }}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#7e22ce', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Todos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {
                showSettleModal && createdRecordForSettle && (
                    <SettlePayableModal
                        record={createdRecordForSettle}
                        onClose={() => {
                            setShowSettleModal(false);
                            setShowSuccess(true);
                            if (onRefresh) onRefresh();
                        }}
                        onSuccess={() => {
                            if (onRefresh) onRefresh();
                        }}
                    />
                )
            }

            {
                showRecurringDeleteModal && editRecord && (
                    <RecurringActionModal
                        isOpen={showRecurringDeleteModal}
                        onClose={() => setShowRecurringDeleteModal(false)}
                        onConfirm={(scope) => {
                            setShowRecurringDeleteModal(false);
                            executeDelete(scope);
                        }}
                        actionType="delete"
                        record={editRecord}
                    />
                )
            }
        </div >
    );
};

export default NewPayableModal;
