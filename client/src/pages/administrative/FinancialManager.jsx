import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, ChevronDown, ChevronUp, X, Plus, Filter, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const FinancialManager = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [financialRecords, setFinancialRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grouped'

    // Modals
    const [showSettleModal, setShowSettleModal] = useState(false);
    const [showNewRecordModal, setShowNewRecordModal] = useState(false);

    // Selection
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Form Data
    const [settleData, setSettleData] = useState({
        paymentMethod: 'pix',
        paymentDate: new Date().toISOString().split('T')[0]
    });

    const [newRecordData, setNewRecordData] = useState({
        type: 'outros',
        direction: 'expense', // expense or income
        category: '',
        description: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        paymentMethod: 'pix'
    });

    useEffect(() => {
        fetchFinancialRecords();
    }, []);

    const fetchFinancialRecords = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/financial');
            const data = await res.json();
            setFinancialRecords(data);
        } catch (error) {
            console.error('Erro ao buscar registros financeiros:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---

    const handleCreateRecord = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/financial/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecordData)
            });
            if (res.ok) {
                fetchFinancialRecords();
                setShowNewRecordModal(false);
                // Reset form
                setNewRecordData({
                    type: 'outros',
                    direction: 'expense',
                    category: '',
                    description: '',
                    amount: '',
                    dueDate: new Date().toISOString().split('T')[0],
                    status: 'pending',
                    paymentMethod: 'pix'
                });
            } else {
                alert('Erro ao criar lançamento');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const openSettleModal = (record) => {
        setSelectedRecord(record);
        setSettleData({
            paymentMethod: 'pix',
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowSettleModal(true);
    };

    const confirmSettlePayment = async () => {
        if (!selectedRecord) return;
        try {
            const res = await fetch(`http://localhost:3000/api/financial/${selectedRecord.id}/settle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settleData)
            });
            if (res.ok) {
                fetchFinancialRecords();
                setShowSettleModal(false);
                setSelectedRecord(null);
            } else {
                alert('Erro ao quitar pagamento');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // --- Helpers ---
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStatusBadge = (status) => {
        const map = {
            paid: { label: 'Pago', class: 'paid' },
            overdue: { label: 'Atrasado', class: 'overdue' },
            pending: { label: 'Pendente', class: 'pending' }
        };
        const s = map[status] || map.pending;
        return <span className={`status-badge ${s.class}`}>{s.label}</span>;
    };

    // --- Rendering ---
    const filteredRecords = financialRecords.filter(r => {
        const search = searchTerm.toLowerCase();
        const studentName = r.Student?.name?.toLowerCase() || '';
        const desc = r.description?.toLowerCase() || '';
        const cat = r.category?.toLowerCase() || '';
        return studentName.includes(search) || desc.includes(search) || cat.includes(search);
    });

    return (
        <div className="manager-container">
            <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ margin: 0 }}>Gestão Financeira</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Receitas, Despesas e Histórico</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className={`btn-secondary ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => setViewMode('list')}
                    >
                        Lista Geral
                    </button>
                    {/* <button 
                        className={`btn-secondary ${viewMode === 'grouped' ? 'active' : ''}`} // Enable if Student Grouping is critical
                        onClick={() => setViewMode('grouped')}
                    >
                        Por Aluno
                    </button> */}
                    <button className="btn-primary" onClick={() => setShowNewRecordModal(true)}>
                        <Plus size={18} /> Novo Lançamento
                    </button>
                </div>
            </div>

            <div className="search-bar" style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Buscar por descrição, aluno ou categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    />
                </div>
            </div>

            {loading ? <p>Carregando...</p> : (
                <div className="financial-list">
                    {filteredRecords.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <p>Nenhum registro encontrado.</p>
                        </div>
                    ) : (
                        <div className="control-card" style={{ overflowX: 'auto' }}>
                            <table className="finance-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '12px' }}>Data Venc.</th>
                                        <th style={{ padding: '12px' }}>Descrição / Aluno</th>
                                        <th style={{ padding: '12px' }}>Categoria</th>
                                        <th style={{ padding: '12px' }}>Tipo</th>
                                        <th style={{ padding: '12px' }}>Valor</th>
                                        <th style={{ padding: '12px' }}>Status</th>
                                        <th style={{ padding: '12px' }}>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRecords.map(record => (
                                        <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '12px' }}>
                                                {new Date(record.dueDate).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 500 }}>{record.description || record.Student?.name || 'Sem Descrição'}</div>
                                                {record.Student && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aluno: {record.Student.name}</div>}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {record.category}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {record.direction === 'income' ? (
                                                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowUpCircle size={14} /> Receita</span>
                                                ) : (
                                                    <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowDownCircle size={14} /> Despesa</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: 600 }}>
                                                {formatCurrency(record.amount)}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {getStatusBadge(record.status)}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                {record.status !== 'paid' && (
                                                    <button
                                                        onClick={() => openSettleModal(record)}
                                                        className="icon-btn"
                                                        title="Quitar"
                                                        style={{ color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal Novo Lançamento */}
            {showNewRecordModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Novo Lançamento</h3>
                            <button onClick={() => setShowNewRecordModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div className="form-group">
                                <label>Tipo de Movimentação</label>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <button
                                        onClick={() => setNewRecordData({ ...newRecordData, direction: 'income' })}
                                        className={`btn-${newRecordData.direction === 'income' ? 'primary' : 'secondary'}`}
                                        style={{ flex: 1, backgroundColor: newRecordData.direction === 'income' ? 'var(--success)' : '' }}
                                    >
                                        Entrada (Receita)
                                    </button>
                                    <button
                                        onClick={() => setNewRecordData({ ...newRecordData, direction: 'expense' })}
                                        className={`btn-${newRecordData.direction === 'expense' ? 'primary' : 'secondary'}`}
                                        style={{ flex: 1, backgroundColor: newRecordData.direction === 'expense' ? 'var(--danger)' : '' }}
                                    >
                                        Saída (Despesa)
                                    </button>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Descrição</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ex: Mensalidade, Conta de Luz"
                                        value={newRecordData.description}
                                        onChange={(e) => setNewRecordData({ ...newRecordData, description: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Valor (R$)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="0.00"
                                        value={newRecordData.amount}
                                        onChange={(e) => setNewRecordData({ ...newRecordData, amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Categoria</label>
                                    <select
                                        className="input-field"
                                        value={newRecordData.category}
                                        onChange={(e) => setNewRecordData({ ...newRecordData, category: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>

                                        <optgroup label="Receitas">
                                            <option value="Mensalidade">Mensalidade</option>
                                            <option value="Matrícula">Matrícula</option>
                                            <option value="Material Didático">Material Didático (Venda)</option>
                                            <option value="Eventos">Receita de Eventos</option>
                                            <option value="Outras Receitas">Outras Receitas</option>
                                        </optgroup>

                                        <optgroup label="Infraestrutura">
                                            <option value="Aluguel">Aluguel do Imóvel</option>
                                            <option value="Energia">Energia Elétrica</option>
                                            <option value="Água">Água / Esgoto</option>
                                            <option value="Internet">Internet / Telefone</option>
                                            <option value="Limpeza">Material de Limpeza</option>
                                            <option value="Manutenção Predial">Manutenção Predial</option>
                                        </optgroup>

                                        <optgroup label="Rh & Pessoal">
                                            <option value="Salários Adm">Salários (Administrativo)</option>
                                            <option value="Salários Prof">Salários (Professores)</option>
                                            <option value="Encargos">Encargos Trabalhistas (FGTS/INSS)</option>
                                            <option value="Benefícios">Benefícios (VT/VR)</option>
                                            <option value="Adiantamentos">Adiantamentos</option>
                                        </optgroup>

                                        <optgroup label="Pedagógico">
                                            <option value="Material Consumo">Material de Consumo (Papelaria/Xerox)</option>
                                            <option value="Licenças">Licenças de Software/Sistemas</option>
                                            <option value="Treinamentos">Treinamentos e Cursos</option>
                                        </optgroup>

                                        <optgroup label="Marketing">
                                            <option value="Publicidade Online">Ads (Google/Meta)</option>
                                            <option value="Panfletagem">Panfletagem / Divulgação Offline</option>
                                            <option value="Brindes">Brindes e Prêmios</option>
                                        </optgroup>

                                        <optgroup label="Administrativo">
                                            <option value="Contabilidade">Contabilidade / Jurídico</option>
                                            <option value="Taxas Bancárias">Taxas Bancárias</option>
                                            <option value="Impostos">Impostos (DAS/ISS)</option>
                                            <option value="Software Gestão">Sistema de Gestão</option>
                                        </optgroup>

                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Data Vencimento</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newRecordData.dueDate}
                                        onChange={(e) => setNewRecordData({ ...newRecordData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    className="input-field"
                                    value={newRecordData.status}
                                    onChange={(e) => setNewRecordData({ ...newRecordData, status: e.target.value })}
                                >
                                    <option value="pending">Pendente (Agendar)</option>
                                    <option value="paid">Pago / Recebido (Imediato)</option>
                                </select>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button className="btn-secondary" onClick={() => setShowNewRecordModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={handleCreateRecord}>Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Quitação Exibido */}
            {showSettleModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Quitar Lançamento</h3>
                            <button onClick={() => setShowSettleModal(false)}><X size={20} /></button>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p style={{ marginBottom: '15px' }}>
                                Confirmar baixa de <strong>{formatCurrency(selectedRecord?.amount)}</strong>?
                            </p>

                            <div className="form-group">
                                <label>Data da Baixa</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={settleData.paymentDate}
                                    onChange={e => setSettleData({ ...settleData, paymentDate: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Forma de Pagamento</label>
                                <select
                                    className="input-field"
                                    value={settleData.paymentMethod}
                                    onChange={e => setSettleData({ ...settleData, paymentMethod: e.target.value })}
                                >
                                    <option value="pix">Pix</option>
                                    <option value="boleto">Boleto</option>
                                    <option value="credit">Cartão Crédito</option>
                                    <option value="debit">Cartão Débito</option>
                                    <option value="money">Dinheiro</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                <button className="btn-secondary" onClick={() => setShowSettleModal(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={confirmSettlePayment} style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}>
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialManager;
