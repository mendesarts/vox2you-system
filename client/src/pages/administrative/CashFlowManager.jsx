import React, { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, TrendingUp, TrendingDown, Plus, Minus, FileText, AlertCircle } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import { useAuth } from '../../context/AuthContext';

const CashFlowManager = () => {
    const { user } = useAuth();
    const [status, setCashStatus] = useState('loading'); // loading, open, closed
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
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/cash-register/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch status');
            }
            const data = await res.json();
            setCashStatus(data.status);
            setRegisterData(data.register);
        } catch (error) {
            console.error('Error fetching cash status:', error);
            setCashStatus('error'); // Stop loading loop
        }
    };

    const handleOpenRegister = async (e) => {
        e.preventDefault();
        if (!user || !user.id) {
            alert('Erro: Usuário não identificado. Tente fazer login novamente.');
            return;
        }
        if (openingBalance === '' || openingBalance === undefined) return alert('Informe o saldo inicial');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/cash-register/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    openingBalance: parseFloat(openingBalance),
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
        if (closingBalance === '' || closingBalance === undefined) return alert('Informe o saldo final');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/cash-register/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    closingBalance: parseFloat(closingBalance),
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
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/transaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    category: transCategory,
                    type: 'outros', // Fixed type per backend requirement? Or dynamic?
                    direction: transType, // 'income' or 'expense'
                    description: transDesc,
                    amount: parseFloat(transAmount),
                    paymentMethod: 'cash',
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

    const calculateDailyTotals = () => {
        if (!registerData || !registerData.Transactions) return { in: 0, out: 0 };

        // Sum transactions
        // Assuming transactions have 'amount' and 'direction' ('income' or 'expense')
        // Also could verify 'type' if needed.
        const ins = registerData.Transactions
            .filter(t => t.direction === 'income')
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        const outs = registerData.Transactions
            .filter(t => t.direction === 'expense')
            .reduce((acc, t) => acc + Number(t.amount || 0), 0);

        return { in: ins, out: outs };
    };

    const dailyTotals = calculateDailyTotals();

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
            {/* Header Status */}
            <div
                className={`status-banner ${status}`}
                style={{
                    background: status === 'open'
                        ? 'linear-gradient(135deg, #34C759 0%, #30B0C7 100%)'
                        : 'linear-gradient(135deg, #FF3B30 0%, #FF9500 100%)',
                    borderRadius: '24px',
                    padding: '32px',
                    color: 'white',
                    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '32px'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.2)',
                        width: '64px', height: '64px',
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {status === 'open' ? <Unlock size={32} /> : <Lock size={32} />}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '800' }}>{status === 'open' ? 'Caixa Aberto' : 'Caixa Fechado'}</h2>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '14px', fontWeight: '500' }}>
                            {status === 'open'
                                ? `Operador: ${registerData?.operator?.name || 'N/A'} • Aberto em: ${new Date(registerData?.openedAt).toLocaleString()}`
                                : 'Abra o caixa para iniciar as operações do dia.'}
                        </p>
                    </div>
                </div>
                {status === 'open' && (
                    <div style={{ textAlign: 'right' }}>
                        <small style={{ display: 'block', fontSize: '13px', opacity: 0.8, fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saldo Atual</small>
                        <h1 style={{ margin: 0, fontSize: '42px', fontWeight: '900', letterSpacing: '-1px' }}>{formatCurrency(registerData?.currentBalance)}</h1>
                    </div>
                )}
            </div>

            {/* Actions Grid */}
            <div className="actions-grid" style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

                {/* Main Operations Area */}
                {/* Main Operations Area */}
                <div className="vox-card" style={{ padding: '32px' }}>
                    {status === 'closed' ? (
                        <div className="open-register-form">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(52, 199, 89, 0.1)', padding: '10px', borderRadius: '12px', color: '#34C759' }}><TrendingUp size={24} /></div>
                                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Abertura de Caixa</h3>
                            </div>

                            <form onSubmit={handleOpenRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-group">
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93', marginBottom: '8px', display: 'block' }}>Saldo Inicial (R$)</label>
                                    <CurrencyInput
                                        required
                                        value={openingBalance}
                                        onChange={setOpeningBalance}
                                        allowNegative={true}
                                        placeholder="0,00"
                                        className="vox-input"
                                        style={{ fontSize: '18px', padding: '16px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93', marginBottom: '8px', display: 'block' }}>Observações</label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Notas sobre a abertura..."
                                        style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E5E5EA', resize: 'vertical', minHeight: '100px', fontSize: '14px' }}
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ padding: '16px', fontSize: '16px', fontWeight: '700' }}>Confirmar Abertura</button>
                            </form>
                        </div>
                    ) : (
                        <div className="close-register-form">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0 }}>Movimentações do Dia</h3>
                                    <p style={{ fontSize: '14px', color: '#8E8E93', margin: '4px 0 0 0' }}>Gerencie sangrias e suprimentos</p>
                                </div>
                                <button className="btn-primary" onClick={() => setShowTransModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={18} /> Nova Movimentação
                                </button>
                            </div>

                            {/* Placeholder bonito */}
                            <div style={{ padding: '40px', background: '#F2F2F7', borderRadius: '16px', textAlign: 'center', marginBottom: '40px' }}>
                                <FileText size={48} color="#C7C7CC" style={{ marginBottom: '16px' }} />
                                <h4 style={{ color: '#8E8E93', margin: 0 }}>Nenhuma movimentação extra hoje</h4>
                            </div>

                            <div style={{ borderTop: '1px solid #E5E5EA', paddingTop: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ background: 'rgba(255, 59, 48, 0.1)', padding: '10px', borderRadius: '12px', color: '#FF3B30' }}><TrendingDown size={24} /></div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#FF3B30' }}>Fechamento de Caixa</h3>
                                </div>

                                <form onSubmit={handleCloseRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93', marginBottom: '8px', display: 'block' }}>Saldo Final Real (Contagem)</label>
                                        <CurrencyInput
                                            required
                                            value={closingBalance}
                                            onChange={setClosingBalance}
                                            allowNegative={true}
                                            className="vox-input"
                                            style={{ fontSize: '18px', padding: '16px' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93', marginBottom: '8px', display: 'block' }}>Observações</label>
                                        <input
                                            type="text"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #E5E5EA', fontSize: '14px' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1', background: '#FF3B30', border: 'none', padding: '16px', fontSize: '16px', fontWeight: '700' }}>
                                        Confirmar Fechamento
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info / Quick Stats */}
                <div className="info-column" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="vox-card" style={{ padding: '24px' }}>
                        <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Resumo do Dia</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: '14px' }}>
                            <span style={{ color: '#8E8E93' }}>Fundo Inicial</span>
                            <strong>{formatCurrency(registerData?.openingBalance)}</strong>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: '#E5E5EA', margin: '16px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: '14px' }}>
                            <span style={{ color: '#34C759' }}>Entradas</span>
                            <strong>{formatCurrency(dailyTotals.in)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '12px 0', fontSize: '14px' }}>
                            <span style={{ color: '#FF3B30' }}>Saídas</span>
                            <strong>{formatCurrency(dailyTotals.out)}</strong>
                        </div>
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
