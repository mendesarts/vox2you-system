import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Edit2, Trash2, CheckCircle, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NewPayableModal from './components/NewPayableModal';

const PersonalFinance = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFinancialTab, setActiveFinancialTab] = useState('payables');
    const [showNewRecordModal, setShowNewRecordModal] = useState(false);
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedRecordId, setSelectedRecordId] = useState(null);

    // Filters
    const [filterStatus, setFilterStatus] = useState('pending');
    const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));

    // --- Fetch Records ---
    const fetchFinancialRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial?scope=personal`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (error) {
            console.error("Erro ao buscar financeiro pessoal:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancialRecords();
    }, []);

    // Summary Calculations
    const calculateTotals = () => {
        const receivables = records.filter(r => r.direction === 'income');
        const payables = records.filter(r => r.direction === 'expense');

        const totalReceivables = receivables.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const totalPayables = payables.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const balance = totalReceivables - totalPayables;

        return { totalReceivables, totalPayables, balance };
    };

    const totals = calculateTotals();

    // Filtering Logic
    const currentDirection = activeFinancialTab === 'receivables' ? 'income' : 'expense';

    const filteredRecords = records.filter(record => {
        // 1. Tab Direction
        if (record.direction !== currentDirection) return false;

        // 2. Status Filter
        let matchesStatus = true;
        if (filterStatus === 'pending') matchesStatus = record.status === 'pending';
        else if (filterStatus === 'paid') matchesStatus = record.status === 'paid';
        else if (filterStatus === 'overdue') matchesStatus = record.status === 'overdue' || (record.status === 'pending' && new Date(record.dueDate) < new Date());

        // 3. Month Filter
        let matchesMonth = true;
        if (filterMonth !== 'all') {
            const due = new Date(record.dueDate);
            const rMonth = String(due.getMonth() + 1).padStart(2, '0');
            matchesMonth = rMonth === filterMonth;
        }

        // 4. Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (record.description?.toLowerCase().includes(searchLower)) ||
            (record.category?.toLowerCase().includes(searchLower));

        return matchesStatus && matchesMonth && matchesSearch;
    });

    // --- Handlers ---
    const handleActionClick = (action) => {
        if (action === 'incluir') {
            setSelectedRecordId(null);
            if (activeFinancialTab === 'payables') {
                setShowNewRecordModal(true);
            } else {
                alert('Inclusão de receitas pessoais em breve.');
            }
        } else if (action === 'editar') {
            if (activeFinancialTab === 'payables') {
                if (!selectedRecordId) return alert('Selecione um registro para editar.');
                setShowNewRecordModal(true);
            } else {
                alert('Edição de Receitas em breve');
            }
        } else {
            alert(`Ação: ${action} em desenvolvimento para o módulo pessoal.`);
        }
    };

    // Helper
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value || 0);
    };

    // Access Control
    if (user.role !== 'master') {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <h2>Acesso Restrito</h2>
                <p>Esta página é exclusiva para o Master.</p>
            </div>
        );
    }

    return (
        <div className="fade-in" style={{ padding: '20px', fontFamily: 'Inter, sans-serif', color: '#1e293b', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>

            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ background: '#7e22ce', color: 'white', padding: '4px 12px', borderRadius: '8px', fontSize: '18px' }}>MASTER</span>
                        Gestão Pessoal
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Controle exclusivo das suas finanças pessoais.
                    </p>
                </div>

                <div style={{ background: 'white', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>SALDO PESSOAL</div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: totals.balance >= 0 ? '#10b981' : '#ef4444' }}>
                        {formatCurrency(totals.balance)}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <div
                        onClick={() => setActiveFinancialTab('payables')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeFinancialTab === 'payables' ? '#ef4444' : 'transparent',
                            color: activeFinancialTab === 'payables' ? 'white' : '#ef4444',
                            fontWeight: 'bold',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: activeFinancialTab === 'payables' ? 'none' : 'underline'
                        }}>
                        Contas a Pagar
                    </div>
                    <div
                        onClick={() => setActiveFinancialTab('receivables')}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: activeFinancialTab === 'receivables' ? '#10b981' : 'transparent',
                            color: activeFinancialTab === 'receivables' ? 'white' : '#10b981',
                            fontWeight: 'bold',
                            borderRadius: '8px 8px 0 0',
                            fontSize: '14px',
                            cursor: 'pointer',
                            textDecoration: activeFinancialTab === 'receivables' ? 'none' : 'underline'
                        }}>
                        Receitas / Retiradas
                    </div>
                </div>
            </div>

            {/* Main Content: Table Left + Sidebar Right */}
            <div style={{ display: 'flex', gap: '16px' }}>
                {/* Left: Data Table */}
                <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '4px', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: '#64748b', color: 'white', textAlign: 'left' }}>
                                    <th style={{ padding: '8px', borderRight: '1px solid #94a3b8' }}>Descrição</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid #94a3b8' }}>Categoria</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid #94a3b8' }}>Vencimento</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid #94a3b8', textAlign: 'right' }}>Valor</th>
                                    <th style={{ padding: '8px', borderRight: '1px solid #94a3b8', textAlign: 'center' }}>Status</th>
                                    <th style={{ padding: '8px', textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record, index) => (
                                        <tr
                                            key={record.id}
                                            onClick={() => setSelectedRecordId(record.id)}
                                            style={{
                                                borderBottom: '1px solid #e2e8f0',
                                                backgroundColor: selectedRecordId === record.id ? '#e0f2fe' : (index % 2 === 0 ? '#fff' : '#f9fafb'),
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <td style={{ padding: '6px 8px', fontWeight: '500' }}>{record.description}</td>
                                            <td style={{ padding: '6px 8px', color: '#64748b' }}>{record.category}</td>
                                            <td style={{ padding: '6px 8px', color: '#64748b' }}>
                                                {new Date(record.dueDate).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td style={{ padding: '6px 8px', fontWeight: '600', textAlign: 'right', color: record.direction === 'income' ? '#10b981' : '#ef4444' }}>
                                                {formatCurrency(record.amount)}
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '700',
                                                    background: record.status === 'paid' ? '#dcfce7' : '#fee2e2',
                                                    color: record.status === 'paid' ? '#166534' : '#991b1b'
                                                }}>
                                                    {record.status === 'paid' ? 'PAGO' : 'PENDENTE'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={{ padding: '8px 12px', background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 'bold', borderTop: '1px solid #e2e8f0' }}>
                        {filteredRecords.length} registro(s)
                    </div>
                </div>

                {/* Right: Sidebar */}
                <div style={{ width: '220px', flexShrink: 0 }}>
                    {/* Actions */}
                    <div style={{ backgroundColor: '#64748b', color: 'white', padding: '8px', fontWeight: 'bold', borderRadius: '4px 4px 0 0', fontSize: '13px' }}>
                        Ações
                    </div>
                    <div style={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderTop: 'none', borderRadius: '0 0 4px 4px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {['Incluir', 'Editar', 'Detalhes', 'Excluir', 'Quitar'].map(action => (
                            <button
                                key={action}
                                onClick={() => handleActionClick(action.toLowerCase())}
                                style={{
                                    width: '100%', padding: '6px 12px', backgroundColor: 'white',
                                    border: '1px solid #cbd5e1', color: '#334155', borderRadius: '4px',
                                    fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center'
                                }}
                            >
                                {action}
                            </button>
                        ))}
                    </div>

                    {/* Quick Filters */}
                    <div style={{ marginTop: '16px', backgroundColor: '#64748b', padding: '8px', borderRadius: '4px 4px 0 0', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                        Filtros Rápidos
                    </div>
                    <div style={{ background: 'white', border: '1px solid #d1d5db', padding: '12px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Status */}
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>Situação</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input type="radio" name="p_status" checked={filterStatus === 'pending'} onChange={() => setFilterStatus('pending')} /> Pendentes
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input type="radio" name="p_status" checked={filterStatus === 'paid'} onChange={() => setFilterStatus('paid')} /> Pagas
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input type="radio" name="p_status" checked={filterStatus === 'overdue'} onChange={() => setFilterStatus('overdue')} /> Vencidas
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input type="radio" name="p_status" checked={filterStatus === 'all'} onChange={() => setFilterStatus('all')} /> Todas
                                </label>
                            </div>
                        </div>

                        {/* Due Date Filter */}
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Vencimento</div>
                            <select
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                            >
                                <option value="all">Todos os Meses</option>
                                {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((m, i) => (
                                    <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#475569' }}>Busca</div>
                            <input
                                type="text"
                                placeholder="Descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '11px' }}
                            />
                        </div>

                        <button
                            onClick={fetchFinancialRecords}
                            style={{
                                width: '100%', padding: '8px',
                                background: 'white', border: '1px solid #7e22ce', color: '#7e22ce',
                                borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            <Search size={14} /> Filtrar
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showNewRecordModal && activeFinancialTab === 'payables' && (
                <NewPayableModal
                    scope="personal"
                    onClose={() => setShowNewRecordModal(false)}
                    onRefresh={fetchFinancialRecords}
                    editRecord={selectedRecordId ? records.find(r => r.id === selectedRecordId) : null}
                    onSuccess={() => {
                        setShowNewRecordModal(false);
                        fetchFinancialRecords();
                    }}
                />
            )}
        </div>
    );
};

export default PersonalFinance;
