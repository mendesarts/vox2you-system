import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, ChevronDown, ChevronUp, X, Plus, Filter, ArrowUpCircle, ArrowDownCircle, FileSpreadsheet, Upload, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import NewPayableModal from './components/NewPayableModal';
import SettlePayableModal from './components/SettlePayableModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import RecurringActionModal from './components/RecurringActionModal';

const formatCurrency = (value) => {
    return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]} /${parts[1]}/${parts[0]} `;
};

const FinancialManager = () => {
    const { user, selectedUnit } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [financialRecords, setFinancialRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grouped'
    const [activeFinancialTab, setActiveFinancialTab] = useState('receivables'); // 'receivables' | 'payables'
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedRecordId, setSelectedRecordId] = useState(null);
    const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
    const [favorecidoSearch, setFavorecidoSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 15;
    const fileInputRef = useRef(null);

    // Modals
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showNewRecordModal, setShowNewRecordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);

    // Selection
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedRecordsForAdvance, setSelectedRecordsForAdvance] = useState([]);
    const [showAdvanceModal, setShowAdvanceModal] = useState(false);
    const [advanceFee, setAdvanceFee] = useState('');

    // Recurring/Installment Actions
    const [showRecurringModal, setShowRecurringModal] = useState(false);
    const [recurringAction, setRecurringAction] = useState(null); // 'edit' or 'delete'
    const [recordForRecurringAction, setRecordForRecurringAction] = useState(null);



    const [newRecordData, setNewRecordData] = useState({
        type: 'outros',
        direction: 'expense', // expense or income
        category: '',
        description: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        paymentMethod: 'pix',
        installments: 1
    });

    useEffect(() => {
        fetchFinancialRecords();
    }, [selectedUnit, filterStatus, filterMonth, activeFinancialTab]);

    const fetchFinancialRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // If selectedUnit is null/undefined (Global All), skip unitId or pass 'all' if backend supports it.
            // Usually backend defaults to user unit if not provided.
            // For separate unit view, we must pass it.
            // If selectedUnit is null (ALL), we can pass 'all' or nothing if we want ALL units.
            // Assuming backend handles query param.
            const unitQuery = selectedUnit ? `?unitId=${selectedUnit}` : '';

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial${unitQuery}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setFinancialRecords(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao buscar registros financeiros:', error);
        } finally {
            setLoading(false);
        }
    };

    // Data Tools
    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/export/csv`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Erro ao exportar');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `financial_export_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (error) {
            console.error(error);
            alert('Erro ao exportar dados.');
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const csvContent = evt.target.result;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/import/csv`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ csvContent })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(`Importação concluída!\nSucesso: ${data.success}\nFalhas: ${data.failed}`);
                    fetchFinancialRecords();
                } else {
                    alert('Erro na importação: ' + data.error);
                }
            } catch (error) {
                console.error(error);
                alert('Erro ao enviar arquivo.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = null;
    };

    const canManageData = ['master', 'franchisee', 'manager', 'admin', 'admin_financial_manager'].includes(user?.role);

    // --- Actions ---

    const handleCreateRecord = async (updateScope = 'current') => {
        try {
            const token = localStorage.getItem('token');
            const isEdit = !!selectedRecordId;
            let updatePlan = updateScope === 'all';

            // Se está editando, verificar se é recorrente/parcelado
            if (isEdit) {
                const record = financialRecords.find(r => r.id === selectedRecordId);
                const isRecurring = record?.launchType === 'recorrente';
                const isInstallment = record?.installments > 1;

                // Se for recorrente ou parcelado E não veio do modal de confirmação
                if ((isRecurring || isInstallment) && updateScope === 'current' && !recordForRecurringAction) {
                    // Mostrar modal para perguntar
                    setRecordForRecurringAction(record);
                    setRecurringAction('edit');
                    setShowRecurringModal(true);
                    return; // Parar aqui e esperar confirmação
                }
            }

            const url = isEdit
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${selectedRecordId}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/record`;

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ ...newRecordData, updatePlan, updateScope })
            });
            if (res.ok) {
                fetchFinancialRecords();
                setShowNewRecordModal(false);
                setSelectedRecordId(null);
                setRecordForRecurringAction(null);
                // Reset form
                setNewRecordData({
                    type: 'outros',
                    direction: 'expense',
                    category: '',
                    description: '',
                    amount: '',
                    dueDate: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    paymentMethod: 'pix',
                    installments: 1
                });
            } else {
                const err = await res.json();
                alert('Erro ao salvar lançamento: ' + (err.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao salvar.');
        }
    };

    const openSettleModal = (record) => {
        setSelectedRecord(record);
        setShowSettleModal(true);
    };

    // confirmSettlePayment is now handled inside SettlePayableModal component

    const confirmAdvance = async () => {
        if (!selectedRecordsForAdvance.length) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/advance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    recordIds: selectedRecordsForAdvance,
                    totalFee: parseFloat(advanceFee) || 0
                })
            });
            if (res.ok) {
                alert('Antecipação realizada com sucesso!');
                fetchFinancialRecords();
                setShowAdvanceModal(false);
                setSelectedRecordsForAdvance([]);
                setAdvanceFee('');
            } else {
                const err = await res.json();
                alert('Erro na antecipação: ' + err.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const toggleRecordSelection = (id) => {
        setSelectedRecordsForAdvance(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    // --- Helpers ---
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value || 0);
    };

    const getStatusBadge = (record) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOverdue = record.status === 'overdue' || (record.status === 'pending' && record.dueDate < todayStr);

        const map = {
            paid: { label: 'Pago', color: '#22c55e' }, // Verde
            overdue: { label: 'Atrasado', color: '#ef4444' }, // Vermelho
            pending: { label: 'Pendente', color: '#f59e0b' } // Laranja/Amarelo
        };

        const statusKey = record.status === 'paid' ? 'paid' : (isOverdue ? 'overdue' : 'pending');
        const s = map[statusKey];

        return (
            <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: s.color,
                margin: '0 auto',
                border: '1px solid rgba(0,0,0,0.1)'
            }} title={s.label} />
        );
    };

    // --- Rendering ---

    // FILTER RECORDS BASED ON TAB (Income vs Expense)
    const currentDirection = activeFinancialTab === 'receivables' ? 'income' : 'expense';

    const filteredRecords = financialRecords.filter(r => {
        // 1. Direction (Tab)
        const matchesDirection = r.direction === currentDirection;

        // 2. Status Filter
        let matchesStatus = true;
        const todayStr = new Date().toISOString().split('T')[0];
        if (filterStatus === 'pending') matchesStatus = r.status === 'pending';
        else if (filterStatus === 'paid') matchesStatus = r.status === 'paid';
        else if (filterStatus === 'overdue') matchesStatus = r.status === 'overdue' || (r.status === 'pending' && r.dueDate < todayStr);
        // 'all' passes true

        // 3. Month Filter (Due Date)
        let matchesMonth = true;
        if (filterMonth !== 'all' && r.dueDate) {
            const parts = r.dueDate.split('-');
            if (parts.length === 3) {
                const recordMonth = parts[1];
                matchesMonth = recordMonth === filterMonth;
            }
        }

        // 4. Search (Destination/Sacado/Desc) - Reused
        const search = searchTerm.toLowerCase();
        const studentName = r.Student?.name?.toLowerCase() || '';
        const desc = r.description?.toLowerCase() || '';
        const cat = r.category?.toLowerCase() || '';
        const matchesSearch = studentName.includes(search) || desc.includes(search) || cat.includes(search);

        // 5. Favorecido specific search
        const fav = favorecidoSearch.toLowerCase();
        const matchesFav = !fav || studentName.includes(fav) || (r.description && r.description.toLowerCase().includes(fav));

        return matchesDirection && matchesStatus && matchesMonth && matchesSearch && matchesFav;
    });

    // Pagination Logic
    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const startIndex = (currentPage - 1) * recordsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, startIndex + recordsPerPage);

    // --- Sponte-like Layout Implementation ---

    // Calculate Totals for the Summary Widget
    const totalAmount = filteredRecords
        .filter(r => r.status !== 'paid')
        .reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);

    // Action Handlers
    const handleActionClick = async (action) => {
        const selectedIds = selectedRecordsForAdvance;
        if (action === 'incluir') {
            setSelectedRecordId(null);
            if (activeFinancialTab === 'payables') {
                // Open new specific modal for Payables
                setShowNewRecordModal(true);
            } else {
                // Receivables
                setNewRecordData({
                    type: 'outros', direction: 'income', category: '', description: '', amount: '',
                    dueDate: new Date().toISOString().split('T')[0], status: 'pending', paymentMethod: 'pix'
                });
                setShowNewRecordModal(true);
            }
        } else if (action === 'quitar') {
            if (selectedIds.length !== 1) return alert('Selecione apenas um registro para quitar.');
            const record = financialRecords.find(r => r.id === selectedIds[0]);
            if (record) openSettleModal(record);
        } else if (action === 'editar') {
            if (!selectedRecordId) return alert('Selecione um registro (clique na linha) para editar.');
            const record = financialRecords.find(r => r.id === selectedRecordId);
            if (!record) return;

            if (activeFinancialTab === 'payables') {
                setShowNewRecordModal(true);
            } else {
                // Populate Receivable Form
                setNewRecordData({
                    type: record.type || 'outros',
                    direction: 'income',
                    category: record.category || '',
                    description: (record.description || '').replace(/\s\(\d+\/\d+\)$/, ''),
                    amount: record.amount,
                    dueDate: record.dueDate || new Date().toISOString().split('T')[0],
                    status: record.status || 'pending',
                    paymentMethod: record.paymentMethod || 'pix',
                    installments: record.installments || 1
                });
                setShowNewRecordModal(true);
            }
        } else if (action === 'excluir') {
            const selectedIds = selectedRecordsForAdvance;
            if (selectedIds.length === 0) return alert('Selecione registros clicando nas linhas para excluir.');

            // Se for apenas 1 registro, verificar se é recorrente/parcelado
            if (selectedIds.length === 1) {
                const record = financialRecords.find(r => r.id === selectedIds[0]);
                const isRecurring = record?.launchType === 'recorrente';
                const isInstallment = record?.installments > 1;

                console.log('🔍 FinancialManager - Verificando exclusão:', {
                    record,
                    isRecurring,
                    isInstallment,
                    planId: record?.planId,
                    shouldShowModal: isRecurring || isInstallment
                });

                if (isRecurring || isInstallment) {
                    // Mostrar modal de escolha
                    console.log('✅ FinancialManager - Mostrando RecurringModal');
                    setRecordForRecurringAction(record);
                    setRecurringAction('delete');
                    setShowRecurringModal(true);
                    return;
                }
            }

            // Preparar informações para o modal
            const recordsToDelete = financialRecords.filter(r => selectedIds.includes(r.id));
            const totalValue = recordsToDelete.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

            setRecordToDelete({
                ids: selectedIds,
                count: selectedIds.length,
                totalValue: totalValue,
                records: recordsToDelete
            });
            setShowDeleteModal(true);
        }
        else {
            alert(`Ação "${action}" não implementada nesta demo.`);
        }
    };

    const handleConfirmDelete = async (deleteScope = 'current') => {
        if (!recordToDelete) return;

        try {
            const token = localStorage.getItem('token');
            let successCount = 0;

            for (const id of recordToDelete.ids) {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${id}?deleteScope=${deleteScope}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) successCount++;
            }

            if (successCount > 0) {
                fetchFinancialRecords();
                setSelectedRecordsForAdvance([]);
                setRecordToDelete(null);
                setShowDeleteModal(false);
                setRecordForRecurringAction(null);
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir registros.');
        }
    };

    const handleRecurringActionConfirm = async (scope) => {
        console.log('🎯 handleRecurringActionConfirm chamado:', { scope, recurringAction });
        setShowRecurringModal(false);

        if (recurringAction === 'edit') {
            // Chamar handleCreateRecord com o escopo escolhido
            handleCreateRecord(scope);
        } else if (recurringAction === 'delete') {
            // Executar exclusão diretamente sem depender do estado
            const record = recordForRecurringAction;

            console.log('🗑️ Executando exclusão:', { recordId: record.id, scope });

            try {
                const token = localStorage.getItem('token');
                const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${record.id}?deleteScope=${scope}`;
                console.log('📡 DELETE request:', url);

                const res = await fetch(url, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                console.log('📥 DELETE response:', { ok: res.ok, status: res.status });

                if (res.ok) {
                    console.log('✅ Exclusão bem-sucedida, atualizando lista');
                    fetchFinancialRecords();
                    setSelectedRecordsForAdvance([]);
                } else {
                    const err = await res.json();
                    console.error('❌ Erro na exclusão:', err);
                    alert('Erro ao excluir: ' + (err.error || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('❌ Erro de conexão:', error);
                alert('Erro ao excluir registros.');
            }
        }

        setRecordForRecurringAction(null);
        setRecurringAction(null);
    };

    return (
        <div className="financial-manager page-fade-in" style={{
            padding: '20px',
            backgroundColor: '#f3f4f6',
            minHeight: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
            overflow: 'visible'
        }}>
            {/* Header / Tabs Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <div
                        onClick={() => setActiveFinancialTab('receivables')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeFinancialTab === 'receivables' ? '#7e22ce' : 'transparent',
                            color: activeFinancialTab === 'receivables' ? 'white' : '#7e22ce',
                            fontWeight: 'bold',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: activeFinancialTab === 'receivables' ? 'none' : 'underline'
                        }}>
                        Contas a Receber
                    </div>
                    <div
                        onClick={() => setActiveFinancialTab('payables')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeFinancialTab === 'payables' ? '#7e22ce' : 'transparent',
                            color: activeFinancialTab === 'payables' ? 'white' : '#7e22ce',
                            fontWeight: 'bold',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: activeFinancialTab === 'payables' ? 'none' : 'underline'
                        }}>
                        Contas a Pagar
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#007bff',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    {activeFinancialTab === 'receivables' ? 'A Receber' : 'A Pagar'}: {formatCurrency(totalAmount)}
                </div>
            </div>
            {/* Main Content: Table Left + Sidebar Right */}
            <div style={{ display: 'flex', gap: '16px', flex: 'none' }}>

                {/* Left: Data Table */}
                <div style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    border: '1px solid #d1d5db',
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'auto',
                    minWidth: 0
                }}>

                    <div style={{ width: '100%', overflowX: 'auto' }}>
                        <table style={{ width: '100%', minWidth: 'max-content', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--ios-teal)', color: 'white', whiteSpace: 'nowrap' }}>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', width: '40px', textAlign: 'center' }}>✓</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'left' }}>Nº Parc.</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'left' }}>
                                        {activeFinancialTab === 'receivables' ? 'Sacado' : 'Favorecido'}
                                    </th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>Data Ven.</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'right' }}>Valor</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'left' }}>Categoria</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>Sit.</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'left' }}>Complemento / Observações</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>Data Pgto.</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.5)', textAlign: 'right' }}>Valor Pago</th>
                                    <th style={{ padding: '8px', textAlign: 'right' }}>Juros/Multa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((record, index) => (
                                    <tr
                                        key={record.id}
                                        onClick={(e) => {
                                            // Clique simples: seleciona para antecipação
                                            if (e.detail === 1) {
                                                toggleRecordSelection(record.id);
                                            }
                                        }}
                                        onDoubleClick={() => {
                                            // Duplo clique: seleciona e abre edição
                                            setSelectedRecordId(record.id);
                                            handleActionClick('editar');
                                        }}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            backgroundColor: selectedRecordsForAdvance.includes(record.id)
                                                ? '#dbeafe'
                                                : selectedRecordId === record.id
                                                    ? '#e0f2fe'
                                                    : (index % 2 === 0 ? '#fff' : '#f9fafb'),
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <td style={{ padding: '6px', textAlign: 'center', width: '40px' }}>
                                            {selectedRecordsForAdvance.includes(record.id) && (
                                                <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '6px', textAlign: 'center' }}>
                                            {record.launchType === 'recorrente' ? '- -' : `${record.currentInstallment || 1}/${record.installments || 1}`}
                                        </td>
                                        <td style={{ padding: '6px' }}>{record.Student?.name || record.description || 'Desconhecido'}</td>
                                        <td style={{ padding: '6px', textAlign: 'center' }}>{formatDate(record.dueDate)}</td>
                                        <td style={{ padding: '6px', textAlign: 'right' }}>{Number(record.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td style={{ padding: '6px' }}>{record.category}</td>
                                        <td style={{ padding: '6px', textAlign: 'center' }}>
                                            {getStatusBadge(record)}
                                        </td>
                                        <td style={{ padding: '6px' }}>{record.description}</td>
                                        <td style={{ padding: '6px', textAlign: 'center' }}>{record.paymentDate ? formatDate(record.paymentDate) : ''}</td>
                                        <td style={{ padding: '6px', textAlign: 'right' }}>{record.status === 'paid' ? Number(record.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}</td>
                                        <td style={{ padding: '6px', textAlign: 'right' }}>0.00</td>
                                    </tr>
                                ))}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan="11" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                            Nenhum registro encontrado em {activeFinancialTab === 'receivables' ? 'Contas a Receber' : 'Contas a Pagar'}.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Footer Info & Pagination */}
                    <div style={{ padding: '12px 16px', background: 'var(--ios-teal)', color: 'white', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 12px 12px' }}>
                        <div>
                            {totalRecords} registro(s) encontrados
                            <span style={{ margin: '0 8px', opacity: 0.5 }}>|</span>
                            Total: {filteredRecords ? formatCurrency(filteredRecords.reduce((acc, r) => acc + Number(r.amount), 0)) : 'R$ 0,00'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{ background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
                            >
                                Ant.
                            </button>
                            <span>Página {currentPage} de {totalPages || 1}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                style={{ background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
                            >
                                Próx.
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Actions Sidebar */}
                <div style={{ width: '240px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>

                    {/* Card Ações */}
                    <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fcfcfc' }}>
                        <div style={{ backgroundColor: 'var(--ios-teal)', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '14px' }}>
                            Ações
                        </div>
                        <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {[
                                { id: 'incluir', label: 'Incluir' },
                                { id: 'editar', label: 'Editar' },
                                { id: 'detalhes', label: 'Detalhes' },
                                { id: 'excluir', label: 'Excluir', color: '#dc3545' },
                                { id: 'quitar', label: 'Quitar' },
                                { id: 'recibo', label: 'Imprimir Recibo' },
                                { id: 'custos', label: 'Centro de Custos' },
                                { id: 'api', label: 'Recebimentos via API' },
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => handleActionClick(btn.id)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e5ea',
                                        color: btn.color || 'var(--ios-text)',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        textAlign: 'center'
                                    }}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtros Rápidos Section */}
                    <div style={{ border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fcfcfc' }}>
                        <div style={{ backgroundColor: 'var(--ios-teal)', color: 'white', padding: '8px 12px', fontWeight: 'bold', fontSize: '14px' }}>
                            Filtros Rápidos
                        </div>
                        <div style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                            <fieldset style={{ border: '1px solid #dee2e6', borderRadius: '8px', padding: '2px 6px 6px 6px', margin: 0 }}>
                                <legend style={{ fontSize: '11px', color: '#6c757d', padding: '0 4px', fontWeight: 'bold' }}>Situação</legend>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', justifyItems: 'start', gap: '6px 12px', fontSize: '11px', color: '#495057' }}>
                                    {[
                                        { id: 'pending', label: 'Pendentes' },
                                        { id: 'paid', label: 'Quitadas' },
                                        { id: 'cancelled', label: 'Canceladas' },
                                        { id: 'overdue', label: 'Vencidas' },
                                        { id: 'all', label: 'Todas' }
                                    ].map(s => (
                                        <label key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '4px', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                                            <input type="radio" name="status" checked={filterStatus === s.id} onChange={() => setFilterStatus(s.id)} style={{ margin: 0 }} />
                                            {s.label}
                                        </label>
                                    ))}
                                </div>
                            </fieldset>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left', marginTop: '1px' }}>
                                <label style={{ fontSize: '11px', color: '#6c757d', fontWeight: 'bold' }}>Vencimento:</label>
                                <select
                                    value={filterMonth}
                                    onChange={(e) => {
                                        setFilterMonth(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: '10px', border: '1px solid #ced4da', fontSize: '13px', background: 'white', color: '#495057', cursor: 'pointer' }}
                                >
                                    <option value="all">Selecione...</option>
                                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                                        <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                                <label style={{ fontSize: '11px', color: '#6c757d', fontWeight: 'bold' }}>Conta a Debitar:</label>
                                <select style={{ width: '100%', padding: '4px 8px', borderRadius: '10px', border: '1px solid #ced4da', fontSize: '13px', background: 'white', color: '#495057', cursor: 'pointer' }}>
                                    <option value="all">(Todas)</option>
                                    <option value="caixa">Caixa Geral</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', textAlign: 'left' }}>
                                <label style={{ fontSize: '11px', color: '#6c757d', fontWeight: 'bold' }}>Destino:</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && fetchFinancialRecords()}
                                    style={{ width: '100%', padding: '4px 8px', borderRadius: '10px', border: '1px solid #ced4da', fontSize: '13px', color: '#495057' }}
                                />
                            </div>

                        </div>
                    </div>
                </div>
            </div>


            {/* Modals */}

            {/* New Payable Modal */}

            {
                showNewRecordModal && activeFinancialTab === 'payables' && (
                    <NewPayableModal
                        onClose={() => setShowNewRecordModal(false)}
                        onRefresh={fetchFinancialRecords}
                        editRecord={selectedRecordId ? financialRecords.find(r => r.id === selectedRecordId) : null}
                        onSuccess={() => {
                            setShowNewRecordModal(false);
                            fetchFinancialRecords();
                        }}
                    />
                )
            }

            {/* Old Receivable Modal (for Contas a Receber) */}
            {
                showNewRecordModal && activeFinancialTab === 'receivables' && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h3>{selectedRecordId ? 'Editar Lançamento' : 'Incluir Novo Título'} (Receber)</h3>
                                <button onClick={() => { setShowNewRecordModal(false); setSelectedRecordId(null); }}><X size={20} /></button>
                            </div>
                            <div style={{ padding: '20px' }}>
                                {/* Standard Receivable Form */}
                                <div className="form-group" style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>Tipo de Movimentação: <span style={{ color: 'green' }}>Receita</span></label>
                                </div>
                                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px' }}>Descrição / Sacado</label>
                                        <input type="text" className="input-field" value={newRecordData.description} onChange={(e) => setNewRecordData({ ...newRecordData, description: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px' }}>Valor (R$)</label>
                                        <input type="number" className="input-field" value={newRecordData.amount} onChange={(e) => setNewRecordData({ ...newRecordData, amount: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                                    </div>
                                </div>
                                <div className="form-row" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px' }}>Categoria</label>
                                        <select className="input-field" value={newRecordData.category} onChange={(e) => setNewRecordData({ ...newRecordData, category: e.target.value })} style={{ width: '100%', padding: '8px' }}>
                                            <option value="">(Selecione)</option>
                                            <option value="VENDAS CURSOS">Vendas Cursos</option>
                                            <option value="VENDAS ACADEMY">Vendas Academy</option>
                                            <option value="VENDAS MASTER">Vendas Master</option>
                                            <option value="VENDAS INTENSIVOX">Vendas Intensivox</option>
                                            <option value="VENDAS ONE VOX">Vendas One Vox</option>
                                            <option value="VENDAS VOX TIME">Vendas Vox Time</option>
                                            <option value="VENDAS INCOMPANY">Vendas Incompany</option>
                                            <option value="VENDAS KIDS E TEENS">Vendas Kids e Teens</option>
                                            <option value="VENDAS PÓS">Vendas Pós-Graduação</option>
                                            <option value="OUTRAS RECEITAS">Outras Receitas</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 0.5 }}>
                                        <label style={{ fontSize: '12px' }}>Parcelas</label>
                                        <input type="number" className="input-field" value={newRecordData.installments} onChange={(e) => setNewRecordData({ ...newRecordData, installments: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label style={{ fontSize: '12px' }}>Vencimento</label>
                                        <input type="date" className="input-field" value={newRecordData.dueDate} onChange={(e) => setNewRecordData({ ...newRecordData, dueDate: e.target.value })} style={{ width: '100%', padding: '8px' }} />
                                    </div>
                                </div>

                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button className="btn-secondary" onClick={() => { setShowNewRecordModal(false); setSelectedRecordId(null); }}>Cancelar</button>
                                    <button className="btn-primary" onClick={handleCreateRecord}>{selectedRecordId ? 'Atualizar' : 'Gravar'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showSettleModal && selectedRecord && (
                    <SettlePayableModal
                        record={selectedRecord}
                        title={activeFinancialTab === 'receivables' ? 'Quitar Conta a Receber' : 'Quitar Conta a Pagar'}
                        onClose={() => {
                            setShowSettleModal(false);
                            setSelectedRecord(null);
                        }}
                        onSuccess={() => {
                            fetchFinancialRecords();
                            setShowSettleModal(false);
                            setSelectedRecord(null);
                            setSelectedRecordsForAdvance([]); // Limpar seleção
                        }}
                    />
                )
            }

            {
                showDeleteModal && (
                    <DeleteConfirmModal
                        isOpen={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setRecordToDelete(null);
                        }}
                        onConfirm={handleConfirmDelete}
                        title="Confirmar Exclusão"
                        message={recordToDelete?.count > 1
                            ? `Tem certeza que deseja excluir os ${recordToDelete.count} registros selecionados?`
                            : "Tem certeza que deseja excluir este registro?"
                        }
                        itemName={recordToDelete?.count > 1
                            ? `Valor total selecionado: ${formatCurrency(recordToDelete.totalValue)}`
                            : recordToDelete?.records[0]?.description || "Registro financeiro"
                        }
                        warningText="Esta ação removerá permanentemente os registros do sistema e não poderá ser desfeita."
                    />
                )
            }

            {
                showRecurringModal && recordForRecurringAction && (
                    <RecurringActionModal
                        isOpen={showRecurringModal}
                        onClose={() => {
                            setShowRecurringModal(false);
                            setRecordForRecurringAction(null);
                            setRecurringAction(null);
                        }}
                        onConfirm={handleRecurringActionConfirm}
                        actionType={recurringAction}
                        record={recordForRecurringAction}
                    />
                )
            }
        </div >
    );
};

export default FinancialManager;
