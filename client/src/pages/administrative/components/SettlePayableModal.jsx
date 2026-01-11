import React, { useState, useEffect } from 'react';
import { X, DollarSign, TrendingDown, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

const SettlePayableModal = ({ record, onClose, onSuccess, title = 'Quitar Conta a Pagar' }) => {
    const [loading, setLoading] = useState(false);
    const [settleData, setSettleData] = useState({
        paymentDate: new Date().toISOString().split('T')[0],
        originalValue: parseFloat(record.amount || 0),
        discount: 0,
        interest: 0,
        fine: 0,
        totalPaid: parseFloat(record.amount || 0),
        paymentMethod: record.paymentMethod || 'pix',
        debitAccount: 'caixa',
        installments: 1 // Novo: número de parcelas
    });

    // Recalculate total whenever values change
    useEffect(() => {
        const total = (
            parseFloat(settleData.originalValue) -
            parseFloat(settleData.discount || 0) +
            parseFloat(settleData.interest || 0) +
            parseFloat(settleData.fine || 0)
        ).toFixed(2);
        setSettleData(prev => ({ ...prev, totalPaid: parseFloat(total) }));
    }, [settleData.originalValue, settleData.discount, settleData.interest, settleData.fine]);

    const handleSettle = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/${record.id}/settle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentDate: settleData.paymentDate,
                    paymentMethod: settleData.paymentMethod,
                    discount: settleData.discount,
                    interest: settleData.interest,
                    fine: settleData.fine,
                    amount: settleData.totalPaid
                })
            });

            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                const err = await res.json();
                alert('Erro ao quitar: ' + (err.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao quitar.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const difference = settleData.totalPaid - settleData.originalValue;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="animate-fade-in" style={{
                backgroundColor: 'white',
                width: '700px',
                maxHeight: '90vh',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>
                            {title}
                        </h2>
                        <p style={{ fontSize: '13px', opacity: 0.9, margin: '4px 0 0 0' }}>
                            {record.description?.split(' - ')[0] || record.description}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '32px', maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
                    {/* Summary Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '24px',
                        border: '1px solid #e2e8f0'
                    }}>
                        {/* Dates Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>📅 Data de Vencimento</p>
                                <p style={{ fontSize: '18px', fontWeight: '800', color: '#ef4444', margin: 0, letterSpacing: '-0.5px' }}>
                                    {new Date(record.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </p>
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>
                                    {(() => {
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const due = new Date(record.dueDate + 'T12:00:00');
                                        due.setHours(0, 0, 0, 0);
                                        const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));
                                        if (diffDays < 0) return `⚠️ ${Math.abs(diffDays)} dias em atraso`;
                                        if (diffDays === 0) return '⏰ Vence hoje';
                                        return `✅ Vence em ${diffDays} dias`;
                                    })()}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>💳 Data do Pagamento</p>
                                <input
                                    type="date"
                                    value={settleData.paymentDate}
                                    onChange={e => setSettleData({ ...settleData, paymentDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '2px solid #10b981',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        fontWeight: '700',
                                        color: '#10b981',
                                        background: '#f0fdf4',
                                        outline: 'none'
                                    }}
                                />
                                <p style={{ fontSize: '11px', color: '#10b981', margin: '4px 0 0 0', fontWeight: '600' }}>
                                    ✓ Confirme a data de pagamento
                                </p>
                            </div>
                        </div>

                        {/* Values Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                            <div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>Valor Original</p>
                                <p style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: 0, letterSpacing: '-1px' }}>
                                    {formatCurrency(settleData.originalValue)}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>Ajustes</p>
                                <p style={{
                                    fontSize: '24px',
                                    fontWeight: '900',
                                    color: difference > 0 ? '#ef4444' : difference < 0 ? '#10b981' : '#64748b',
                                    margin: 0,
                                    letterSpacing: '-1px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    {difference > 0 ? <TrendingUp size={20} /> : difference < 0 ? <TrendingDown size={20} /> : null}
                                    {formatCurrency(Math.abs(difference))}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: '600' }}>Valor a Pagar</p>
                                <p style={{ fontSize: '24px', fontWeight: '900', color: '#7e22ce', margin: 0, letterSpacing: '-1px' }}>
                                    {formatCurrency(settleData.totalPaid)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Adjustments Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
                                Desconto
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#10b981', fontWeight: '700' }}>R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settleData.discount}
                                    onChange={e => setSettleData({ ...settleData, discount: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 40px',
                                        border: '2px solid #dcfce7',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        background: '#f0fdf4',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
                                Juros
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontWeight: '700' }}>R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settleData.interest}
                                    onChange={e => setSettleData({ ...settleData, interest: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 40px',
                                        border: '2px solid #fee2e2',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        background: '#fef2f2',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
                                Multa
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', fontWeight: '700' }}>R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={settleData.fine}
                                    onChange={e => setSettleData({ ...settleData, fine: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px 12px 40px',
                                        border: '2px solid #fed7aa',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        background: '#fffbeb',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
                            Forma de Pagamento
                        </label>
                        <select
                            value={settleData.paymentMethod}
                            onChange={e => setSettleData({ ...settleData, paymentMethod: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="pix">💳 Pix</option>
                            <option value="boleto">📄 Boleto</option>
                            <option value="cartao_credito">💳 Cartão de Crédito</option>
                            <option value="cartao_debito">💳 Cartão de Débito</option>
                            <option value="cheque">📝 Cheque</option>
                            <option value="automatic_debit">🔄 Débito Automático</option>
                            <option value="dinheiro">💵 Dinheiro</option>
                            <option value="recorrencia">🔁 Recorrência</option>
                            <option value="transferencia">🏦 Transferência</option>
                        </select>
                    </div>

                    {/* Installments - Only for Credit Card */}
                    {settleData.paymentMethod === 'cartao_credito' && (
                        <div style={{
                            marginBottom: '24px',
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '2px solid #bfdbfe'
                        }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#1e40af', marginBottom: '12px', fontWeight: '700' }}>
                                💳 Parcelamento no Cartão de Crédito
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: '600' }}>
                                        Número de Parcelas
                                    </label>
                                    <select
                                        value={settleData.installments}
                                        onChange={e => setSettleData({ ...settleData, installments: parseInt(e.target.value) })}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            border: '2px solid #93c5fd',
                                            borderRadius: '10px',
                                            background: 'white',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                            <option key={n} value={n}>
                                                {n}x {n === 1 ? '(à vista)' : `de ${formatCurrency(settleData.totalPaid / n)}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px', fontWeight: '600' }}>
                                        Valor da Parcela
                                    </label>
                                    <div style={{
                                        padding: '10px 14px',
                                        border: '2px solid #93c5fd',
                                        borderRadius: '10px',
                                        background: '#f0f9ff',
                                        fontSize: '16px',
                                        fontWeight: '800',
                                        color: '#1e40af',
                                        textAlign: 'center'
                                    }}>
                                        {formatCurrency(settleData.totalPaid / settleData.installments)}
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', marginBottom: 0, fontStyle: 'italic' }}>
                                ℹ️ O parcelamento será registrado no sistema para controle financeiro
                            </p>
                        </div>
                    )}

                    {/* Debit Account */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '13px', color: '#475569', marginBottom: '8px', fontWeight: '600' }}>
                            Debitar na Conta
                        </label>
                        <select
                            value={settleData.debitAccount}
                            onChange={e => setSettleData({ ...settleData, debitAccount: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '12px',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                outline: 'none'
                            }}
                        >
                            <option value="caixa">🏦 Caixa Geral [Vox2You]</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '2px solid #e2e8f0',
                            background: 'white',
                            color: '#64748b',
                            fontSize: '14px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#cbd5e1';
                            e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = 'white';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSettle}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 32px',
                            borderRadius: '12px',
                            border: 'none',
                            background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '800',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            transition: 'transform 0.2s'
                        }}
                        onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.02)')}
                        onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                    >
                        <CheckCircle2 size={18} />
                        {loading ? 'Processando...' : 'Confirmar Pagamento'}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default SettlePayableModal;
