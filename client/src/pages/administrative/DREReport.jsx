import React, { useState, useEffect } from 'react';
import { Calendar, Download, Printer, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const DREReport = () => {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReport();
    }, [startDate, endDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/financial/dre?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setReport(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    // Calculate percentages relative to total revenue
    const getPercent = (val) => {
        if (!report || report.totalRevenue === 0) return '0%';
        return ((val / report.totalRevenue) * 100).toFixed(1) + '%';
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="dre-report animate-fade-in" style={{ paddingBottom: '30px' }}>
            {/* Header / Filter */}
            <div className="report-controls no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="date-input-group">
                        <label>Início</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="date-input-group">
                        <label>Fim</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <button className="btn-secondary" onClick={fetchReport} disabled={loading}>
                        {loading ? 'Atualizando...' : 'Atualizar'}
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={handlePrint}>
                        <Printer size={16} style={{ marginRight: 8 }} /> Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="dre-paper p-8 bg-white shadow-lg rounded-lg print-setup" style={{ maxWidth: '900px', margin: '0 auto', background: 'white', padding: '40px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                <div className="dre-header" style={{ textAlign: 'center', marginBottom: '30px', paddingBottom: '20px', borderBottom: '2px solid #eee' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Demonstrativo do Resultado do Exercício (DRE)</h1>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>
                        Período: {new Date(startDate).toLocaleDateString()} a {new Date(endDate).toLocaleDateString()}
                    </p>
                </div>

                {report && (
                    <div className="dre-content">
                        {/* Revenue Section */}
                        <div className="dre-section">
                            <h3 className="section-title text-emerald-600" style={{ color: '#059669', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>(+) Receita Bruta</span>
                                <span>{formatCurrency(report.totalRevenue)}</span>
                            </h3>
                            <div className="dre-rows">
                                {Object.entries(report.revenue).map(([cat, val]) => (
                                    <div key={cat} className="dre-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #f1f5f9', fontSize: '0.95rem' }}>
                                        <span style={{ color: '#475569' }}>{cat}</span>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.9em' }}>{getPercent(val)}</span>
                                            <span style={{ fontWeight: 500 }}>{formatCurrency(val)}</span>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(report.revenue).length === 0 && <p className="empty-msg">Nenhuma receita no período.</p>}
                            </div>
                        </div>

                        {/* Deductions (Placeholder) */}
                        {/* Add if we have tax logic later */}

                        {/* Net Revenue Line */}
                        <div className="dre-summary-line" style={{ background: '#f8fafc', padding: '10px', marginTop: '10px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>(=) Receita Líquida</span>
                            <span>{formatCurrency(report.totalRevenue)}</span>
                        </div>

                        {/* Expenses Section */}
                        <div className="dre-section">
                            <h3 className="section-title text-red-500" style={{ color: '#ef4444', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>(-) Despesas Operacionais</span>
                                <span>{formatCurrency(report.totalExpenses)}</span>
                            </h3>
                            <div className="dre-rows">
                                {Object.entries(report.expenses).map(([cat, val]) => (
                                    <div key={cat} className="dre-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #f1f5f9', fontSize: '0.95rem' }}>
                                        <span style={{ color: '#475569' }}>{cat}</span>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <span style={{ color: '#94a3b8', fontSize: '0.9em' }}>{getPercent(val)}</span>
                                            <span style={{ fontWeight: 500 }}>{formatCurrency(val)}</span>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(report.expenses).length === 0 && <p className="empty-msg">Nenhuma despesa no período.</p>}
                            </div>
                        </div>

                        {/* Result Section */}
                        <div className="dre-result" style={{ marginTop: '40px', background: report.netResult >= 0 ? '#ecfdf5' : '#fef2f2', padding: '20px', borderRadius: '8px', border: `1px solid ${report.netResult >= 0 ? '#10b981' : '#ef4444'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ margin: 0, color: report.netResult >= 0 ? '#047857' : '#b91c1c', fontSize: '1.5rem' }}>
                                        Resultado do Exercício
                                    </h2>
                                    <p style={{ margin: '5px 0 0', opacity: 0.8 }}>Lucro/Prejuízo Líquido</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: report.netResult >= 0 ? '#059669' : '#dc2626' }}>
                                        {formatCurrency(report.netResult)}
                                    </h2>
                                    <span style={{ fontWeight: 600, color: report.netResult >= 0 ? '#059669' : '#dc2626', background: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: '4px' }}>
                                        Margem: {getPercent(report.netResult)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .date-input-group {
                    display: flex; flex-direction: column; gap: 4px;
                }
                .date-input-group label {
                    font-size: 0.8rem; color: var(--text-muted);
                }
                .date-input-group input {
                    padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-surface); color: var(--text-primary);
                }
                .empty-msg {
                    padding: 20px; text-align: center; color: var(--text-muted); font-style: italic;
                }
                @media print {
                    @page { margin: 0; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    .no-print, .financial-dashboard > div:first-child { display: none !important; }
                    .dre-paper { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; }
                    .financial-dashboard { padding: 0 !important; }
                    .page-header, .sidebar { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default DREReport;
