import React, { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, TrendingUp, TrendingDown, Plus, Minus, FileText, AlertCircle } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import { useAuth } from '../../context/AuthContext';

const CashFlowManager = () => {
    const { user } = useAuth();
    const [status, setStatus] = useState('loading'); // loading, open, closed
    const [registerData, setRegisterData] = useState(null);
    const [openingBalance, setOpeningBalance] = useState('');
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');

    // Transaction Form
    const [showTransModal, setShowTransModal] = useState(false);
    const [transType, setTransType] = useState('income'); // income, expense
    const [transCategory, setTransCategory] = useState('Suprimento');
    const [transAmount, setTransAmount] = useState('');
    const [transDesc, setTransDesc] = useState('');

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/financial/cash-register/status');
            if (!res.ok) throw new Error('Failed to fetch status');
            const data = await res.json();
            setStatus(data.status);
            setRegisterData(data.register);
        } catch (error) {
            console.error('Error fetching cash status:', error);
            setStatus('error'); // Stop loading loop
        }
    };

    const handleOpenRegister = async (e) => {
        e.preventDefault();
        if (!user || !user.id) {
            alert('Erro: Usuário não identificado. Tente fazer login novamente.');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/api/financial/cash-register/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    openingBalance: Number(openingBalance),
                    notes
                })
            });

            if (res.ok) {
                fetchStatus();
                setOpeningBalance('');
                setNotes('');
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (error) {
            alert('Erro ao abrir caixa');
        }
    };

    const handleCloseRegister = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/financial/cash-register/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    closingBalance: Number(closingBalance),
                    notes
                })
            });

            if (res.ok) {
                fetchStatus();
                setClosingBalance('');
                setNotes('');
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (error) {
            alert('Erro ao fechar caixa');
        }
    };

    const handleTransaction = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/financial/transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: transCategory,
                    type: 'outros',
                    description: transDesc,
                    amount: Number(transAmount),
                    direction: transType,
                    paymentMethod: 'cash', // Default to cash for register ops? Or add selector
                    paymentDate: new Date()
                })
            });

            if (res.ok) {
                setShowTransModal(false);
                setTransAmount('');
                setTransDesc('');
                fetchStatus(); // Refresh balance
            } else {
                alert('Erro ao salvar movimentação');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    if (status === 'loading') return <div>Carregando...</div>;
    if (status === 'error') return (
        <div>
            <p className="text-red-500">Erro ao carregar sistema de caixa. Verifique se o servidor está rodando.</p>
            <button className="btn-primary" onClick={fetchStatus}>Tentar Novamente</button>
        </div>
    );

    return (
        <div className="cash-flow-manager animate-fade-in">
            {/* Header Status */}
            <div className={`status - banner ${status} `}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div className={`icon - circle ${status} `}>
                        {status === 'open' ? <Unlock size={24} /> : <Lock size={24} />}
                    </div>
                    <div>
                        <h2 style={{ margin: 0 }}>{status === 'open' ? 'Caixa Aberto' : 'Caixa Fechado'}</h2>
                        <p style={{ margin: 0, opacity: 0.8 }}>
                            {status === 'open'
                                ? `Operador: ${registerData?.operator?.name || 'N/A'} • Aberto em: ${new Date(registerData?.openedAt).toLocaleString()} `
                                : 'Abra o caixa para iniciar as operações do dia.'}
                        </p>
                    </div>
                </div>
                {status === 'open' && (
                    <div className="current-balance">
                        <small>Saldo Atual em Caixa</small>
                        <h1>{formatCurrency(registerData?.currentBalance)}</h1>
                    </div>
                )}
            </div>

            {/* Actions Grid */}
            <div className="actions-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                {/* Main Operations Area */}
                <div className="control-card">
                    {status === 'closed' ? (
                        <div className="open-register-form" style={{ padding: '20px' }}>
                            <h3><TrendingUp size={20} style={{ marginRight: '8px' }} /> Abertura de Caixa</h3>
                            <form onSubmit={handleOpenRegister} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Saldo Inicial (R$)</label>
                                    <CurrencyInput
                                        required
                                        value={openingBalance}
                                        onChange={setOpeningBalance}
                                        placeholder="0,00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Observações</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Notas sobre a abertura..."
                                    />
                                </div>
                                <button type="submit" className="btn-primary btn-lg">Confirmar Abertura</button>
                            </form>
                        </div>
                    ) : (
                        <div className="close-register-form" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3>Movimentações do Dia</h3>
                                <button className="btn-secondary" onClick={() => setShowTransModal(true)}>
                                    <Plus size={16} /> Nova Movimentação
                                </button>
                            </div>

                            {/* Transaction List would go here - for now just summary */}
                            <div className="transactions-list-placeholder">
                                <p style={{ color: 'var(--text-muted)' }}>Use a movimentação para sangrias e suprimentos.</p>
                            </div>

                            <div style={{ marginTop: '40px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                                <h3><TrendingDown size={20} style={{ marginRight: '8px', color: 'red' }} /> Fechamento de Caixa</h3>
                                <form onSubmit={handleCloseRegister} style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label>Saldo Final Real (Contagem)</label>
                                        <CurrencyInput
                                            required
                                            value={closingBalance}
                                            onChange={setClosingBalance}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Observações de Fechamento</label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1', backgroundColor: '#dc2626' }}>
                                        Confirmar Fechamento
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info / Quick Stats */}
                <div className="info-column" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="control-card" style={{ padding: '20px' }}>
                        <h4>Resumo do Dia</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0' }}>
                            <span>Fundo Inicial:</span>
                            <strong>{formatCurrency(registerData?.openingBalance)}</strong>
                        </div>
                        {/* More stats coming soon */}
                    </div>
                </div>
            </div>

            {/* Transaction Modal */}
            {showTransModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Nova Movimentação (Manual)</h3>
                        <form onSubmit={handleTransaction}>
                            <div className="form-group">
                                <label>Tipo</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        className={`btn - ${transType === 'income' ? 'primary' : 'secondary'} `}
                                        onClick={() => setTransType('income')}
                                        style={{ flex: 1 }}
                                    >
                                        Suprimento (Entrada)
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn - ${transType === 'expense' ? 'primary' : 'secondary'} `}
                                        onClick={() => setTransType('expense')}
                                        style={{ flex: 1, backgroundColor: transType === 'expense' ? '#ef4444' : '', color: transType === 'expense' ? 'white' : '' }}
                                    >
                                        Sangria (Saída)
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select value={transCategory} onChange={e => setTransCategory(e.target.value)}>
                                    <option>Suprimento</option>
                                    <option>Sangria</option>
                                    <option>Despesa Diversa</option>
                                    <option>Outros</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Valor</label>
                                <CurrencyInput
                                    required
                                    value={transAmount}
                                    onChange={setTransAmount}
                                />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <input type="text" required value={transDesc} onChange={e => setTransDesc(e.target.value)} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowTransModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
    .status - banner {
    background: linear - gradient(135deg, #1e293b, #0f172a);
    color: white;
    padding: 30px;
    border - radius: 12px;
    display: flex;
    justify - content: space - between;
    align - items: center;
    box - shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
                .status - banner.open { background: linear - gradient(135deg, #059669, #047857); }
                .status - banner.closed { background: linear - gradient(135deg, #475569, #334155); }
                
                .icon - circle {
    background: rgba(255, 255, 255, 0.2);
    width: 50px; height: 50px;
    border - radius: 50 %;
    display: flex; align - items: center; justify - content: center;
}
                .input - lg {
    font - size: 1.5rem;
    padding: 15px;
}
`}</style>
        </div>
    );
};

export default CashFlowManager;
