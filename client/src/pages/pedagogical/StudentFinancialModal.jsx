import React, { useState, useEffect } from 'react';
import { VoxModal } from '../../components/VoxUI';
import { DollarSign, FileText, CheckCircle, AlertCircle, Calendar, CreditCard, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StudentFinancialModal = ({ isOpen, onClose, student }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('loading'); // 'loading', 'list', 'create'
    const [records, setRecords] = useState([]);

    // Form State
    const [form, setForm] = useState({
        enrollment: { enabled: true, amount: 0, date: new Date().toISOString().split('T')[0], isPaid: false, method: 'pix' },
        material: { enabled: true, amount: 0, installments: 1, date: new Date().toISOString().split('T')[0], isPaid: false, method: 'pix' },
        course: { enabled: true, amount: 0, installments: 12, date: new Date().toISOString().split('T')[0], method: 'boleto' }
    });

    useEffect(() => {
        if (isOpen && student) {
            loadFinancialData();
        }
    }, [isOpen, student]);

    const loadFinancialData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');

            // 1. Fetch Existing Records
            const resRecords = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial?studentId=${student.id}&scope=business`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dataRecords = await resRecords.json();

            if (Array.isArray(dataRecords) && dataRecords.length > 0) {
                setRecords(dataRecords);
                setView('list');
            } else {
                // 2. If no records, try to fetch Lead data to pre-fill
                if (student.leadId) {
                    try {
                        const resLead = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads/${student.leadId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (resLead.ok) {
                            const lead = await resLead.json();
                            // Pre-fill form
                            setForm(prev => ({
                                ...prev,
                                enrollment: { ...prev.enrollment, amount: lead.enrollment_value || 0 },
                                material: { ...prev.material, amount: lead.material_value || 0 },
                                course: {
                                    ...prev.course,
                                    amount: lead.sales_value || 0,
                                    installments: lead.installments || 12
                                }
                            }));
                        }
                    } catch (err) {
                        console.warn('Could not fetch lead data', err);
                    }
                }
                setRecords([]);
                setView('create');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar dados financeiros');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                studentId: student.id,
                fees: {
                    enrollmentFee: form.enrollment.enabled ? {
                        amount: form.enrollment.amount,
                        dueDate: form.enrollment.date,
                        isPaid: form.enrollment.isPaid,
                        method: form.enrollment.method,
                        installments: 1
                    } : null,
                    materialFee: form.material.enabled ? {
                        amount: form.material.amount,
                        installments: form.material.installments,
                        dueDate: form.material.date,
                        isPaid: form.material.isPaid,
                        method: form.material.method
                    } : null,
                    courseFee: form.course.enabled ? {
                        amount: form.course.amount,
                        installments: form.course.installments,
                        dueDate: form.course.date,
                        method: form.course.method,
                        isPaid: false
                    } : null
                }
            };

            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Reload
                const resRecords = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/financial?studentId=${student.id}&scope=business`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const dataRecords = await resRecords.json();
                setRecords(dataRecords);
                setView('list');
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao gerar financeiro');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const renderList = () => {
        const total = records.reduce((acc, r) => acc + Number(r.amount), 0);
        const paid = records.filter(r => r.status === 'paid').reduce((acc, r) => acc + Number(r.amount), 0);
        const pending = records.filter(r => r.status === 'pending').reduce((acc, r) => acc + Number(r.amount), 0);

        return (
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Total Contratado</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>{formatCurrency(total)}</div>
                    </div>
                    <div style={{ background: 'rgba(40, 167, 69, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(40, 167, 69, 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#28a745' }}>Total Pago</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#28a745' }}>{formatCurrency(paid)}</div>
                    </div>
                    <div style={{ background: 'rgba(255, 193, 7, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.2)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#856404' }}>Pendente</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#856404' }}>{formatCurrency(pending)}</div>
                    </div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Descrição</th>
                                <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Vencimento</th>
                                <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Valor</th>
                                <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '10px' }}>{r.description}</td>
                                    <td style={{ padding: '10px' }}>{formatDate(r.dueDate)}</td>
                                    <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(r.amount)}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem',
                                            background: r.status === 'paid' ? '#d4edda' : r.status === 'overdue' ? '#f8d7da' : '#fff3cd',
                                            color: r.status === 'paid' ? '#155724' : r.status === 'overdue' ? '#721c24' : '#856404'
                                        }}>
                                            {r.status === 'paid' ? 'PAGO' : r.status === 'pending' ? 'PENDENTE' : 'ATRASADO'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderCreate = () => (
        <div style={{ padding: '16px', maxHeight: '600px', overflowY: 'auto' }}>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#e3f2fd', borderRadius: '8px', fontSize: '0.85rem', color: '#0d47a1', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AlertCircle size={18} />
                <div>
                    <strong>Gerar Contrato Financeiro</strong><br />
                    Confira os valores abaixo trazidos do cadastro do aluno/lead.
                </div>
            </div>

            {/* Matrícula */}
            <div className="card-section" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            checked={form.enrollment.enabled}
                            onChange={e => setForm(p => ({ ...p, enrollment: { ...p.enrollment, enabled: e.target.checked } }))}
                            style={{ margin: 0, width: '16px', height: '16px' }}
                        />
                        Taxa de Matrícula
                    </label>
                </div>
                {form.enrollment.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Valor (R$)</label>
                            <input
                                type="number"
                                value={form.enrollment.amount}
                                onChange={e => setForm(p => ({ ...p, enrollment: { ...p.enrollment, amount: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Vencimento</label>
                            <input
                                type="date"
                                value={form.enrollment.date}
                                onChange={e => setForm(p => ({ ...p, enrollment: { ...p.enrollment, date: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Forma de Pagamento</label>
                            <select
                                value={form.enrollment.method}
                                onChange={e => setForm(p => ({ ...p, enrollment: { ...p.enrollment, method: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            >
                                {['crédito', 'débito', 'dinheiro', 'pix', 'cheque', 'boleto', 'permuta', 'nota de empenho'].map(m => (
                                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', marginTop: '4px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={form.enrollment.isPaid}
                                    onChange={e => setForm(p => ({ ...p, enrollment: { ...p.enrollment, isPaid: e.target.checked } }))}
                                    style={{ margin: 0, width: '14px', height: '14px' }}
                                />
                                Já foi pago? (Lançar no Caixa)
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Material */}
            <div className="card-section" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            checked={form.material.enabled}
                            onChange={e => setForm(p => ({ ...p, material: { ...p.material, enabled: e.target.checked } }))}
                            style={{ margin: 0, width: '16px', height: '16px' }}
                        />
                        Material Didático
                    </label>
                    {form.material.enabled && (
                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="materialSource"
                                    checked={!form.material.isExternalLink}
                                    onChange={() => setForm(p => ({ ...p, material: { ...p.material, isExternalLink: false } }))}
                                /> Estoque da Escola
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="materialSource"
                                    checked={form.material.isExternalLink}
                                    onChange={() => setForm(p => ({ ...p, material: { ...p.material, isExternalLink: true } }))}
                                /> Direto da Editora (Link)
                            </label>
                        </div>
                    )}
                </div>
                {form.material.enabled && !form.material.isExternalLink && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Valor Total (R$)</label>
                            <input
                                type="number"
                                value={form.material.amount}
                                onChange={e => setForm(p => ({ ...p, material: { ...p.material, amount: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Parcelas</label>
                            <input
                                type="number"
                                value={form.material.installments}
                                onChange={e => setForm(p => ({ ...p, material: { ...p.material, installments: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>1º Vencimento</label>
                            <input
                                type="date"
                                value={form.material.date}
                                onChange={e => setForm(p => ({ ...p, material: { ...p.material, date: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Forma de Pagamento (Entrada/Parc.)</label>
                            <select
                                value={form.material.method}
                                onChange={e => setForm(p => ({ ...p, material: { ...p.material, method: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            >
                                {['crédito', 'débito', 'dinheiro', 'pix', 'cheque', 'boleto', 'permuta', 'nota de empenho'].map(m => (
                                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', marginTop: '4px' }}>
                            <label style={{ fontSize: '0.8rem', color: '#666', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={form.material.isPaid}
                                    onChange={e => setForm(p => ({ ...p, material: { ...p.material, isPaid: e.target.checked } }))}
                                    style={{ margin: 0, width: '14px', height: '14px' }}
                                />
                                Entrada/1ª Parc. já foi paga?
                            </label>
                        </div>
                    </div>
                )}
                {form.material.enabled && form.material.isExternalLink && (
                    <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '4px', fontSize: '0.8rem', color: '#856404' }}>
                        O pagamento do material será tratado externamente direto com a editora. Nenhum lançamento financeiro será gerado no sistema.
                    </div>
                )}
            </div>

            {/* Curso */}
            <div className="card-section" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input
                            type="checkbox"
                            checked={form.course.enabled}
                            onChange={e => setForm(p => ({ ...p, course: { ...p.course, enabled: e.target.checked } }))}
                            style={{ margin: 0, width: '16px', height: '16px' }}
                        />
                        Curso / Mensalidade
                    </label>
                </div>
                {form.course.enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end' }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Valor Total (R$)</label>
                            <input
                                type="number"
                                value={form.course.amount}
                                onChange={e => setForm(p => ({ ...p, course: { ...p.course, amount: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Parcelas</label>
                            <input
                                type="number"
                                value={form.course.installments}
                                onChange={e => setForm(p => ({ ...p, course: { ...p.course, installments: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>1º Vencimento</label>
                            <input
                                type="date"
                                value={form.course.date}
                                onChange={e => setForm(p => ({ ...p, course: { ...p.course, date: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                            <label style={{ fontSize: '0.75rem', color: '#666', marginBottom: '4px', display: 'block' }}>Forma de Pagamento Preferencial</label>
                            <select
                                value={form.course.method}
                                onChange={e => setForm(p => ({ ...p, course: { ...p.course, method: e.target.value } }))}
                                style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.85rem' }}
                            >
                                {['boleto', 'crédito', 'débito', 'dinheiro', 'pix', 'cheque', 'permuta', 'nota de empenho'].map(m => (
                                    <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 3', fontSize: '0.75rem', color: '#666', background: '#f8f9fa', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                            Mensalidade Estimada: <strong>{formatCurrency(form.course.amount / form.course.installments)}</strong> / mês
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button onClick={onClose} className="btn-secondary">Cancelar</button>
                <button onClick={handleGenerate} className="btn-primary" disabled={loading}>
                    {loading ? 'Processando...' : 'Gerar Contrato'}
                </button>
            </div>
        </div>
    );

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Financeiro: ${student?.name || ''}`}
            width="700px"
        >
            {loading && view === 'loading' ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Carregando dados financeiros...</div>
            ) : view === 'list' && records.length > 0 ? (
                renderList()
            ) : (
                renderCreate()
            )}
        </VoxModal>
    );
};

export default StudentFinancialModal;
