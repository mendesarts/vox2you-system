import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckCircle, XCircle, CalendarClock, Phone, ArrowLeft, Save, Briefcase, GraduationCap, Clock, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ConsultationResultPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);

    const [resultType, setResultType] = useState(null); // 'attended', 'rescheduled', 'no_show'
    const [attendedAction, setAttendedAction] = useState(null); // 'negotiation', 'enrollment'
    const [formData, setFormData] = useState({ notes: '', nextDate: '', value: '' });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => { fetchLead(); }, [id]);

    const fetchLead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/crm/leads/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setLead(data);
                if (data.value) setFormData(prev => ({ ...prev, value: data.value }));
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let payload = { notes: formData.notes };
            let redirectAction = null;

            if (resultType === 'attended') {
                if (attendedAction === 'enrollment') {
                    payload.status = 'won';
                    payload.notes = `[MATRÍCULA INICIADA] ${formData.notes}`;
                    redirectAction = 'enroll';
                } else if (attendedAction === 'negotiation') {
                    payload.status = 'negotiation';
                    payload.notes = `[EM NEGOCIAÇÃO] ${formData.notes}`;
                    if (!formData.nextDate) { alert('Informe a data do próximo contato.'); setLoading(false); return; }
                    payload.nextTaskDate = new Date(formData.nextDate).toISOString();
                    payload.nextTaskType = 'Negociar';
                }
            } else if (resultType === 'rescheduled') {
                payload.status = 'scheduled';
                payload.notes = `[REAGENDOU] ${formData.notes}`;
                if (!formData.nextDate) { alert('Informe a nova data da consultoria.'); setLoading(false); return; }
                payload.appointmentDate = new Date(formData.nextDate).toISOString();
            } else if (resultType === 'no_show') {
                payload.status = 'no_show';
                payload.notes = `[NÃO COMPARECEU] ${formData.notes}`;
                if (!formData.nextDate) { alert('Informe a data para a nova tentativa de contato.'); setLoading(false); return; }
                payload.nextTaskDate = new Date(formData.nextDate).toISOString();
                payload.nextTaskType = 'Nova Tentativa';
            }

            const res = await fetch(`${API_URL}/crm/leads/${id}/move`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                if (redirectAction === 'enroll') navigate('/crm', { state: { openLeadId: id, mode: 'enrollment' } });
                else navigate('/crm');
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    if (loading && !lead) return <div style={{ padding: '100px', textAlign: 'center', fontWeight: '900', opacity: 0.5 }}>Sincronizando...</div>;
    if (!lead) return <div style={{ padding: '100px', textAlign: 'center', color: '#FF3B30' }}>Lead não encontrado.</div>;

    const isFormValid = () => {
        if (!resultType) return false;
        if (resultType === 'attended' && !attendedAction) return false;
        if (resultType === 'attended' && attendedAction === 'negotiation' && !formData.nextDate) return false;
        if (resultType === 'rescheduled' && !formData.nextDate) return false;
        if (resultType === 'no_show' && !formData.nextDate) return false;
        return true;
    };

    return (
        <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '100px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#fff', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', justifyCenter: 'center', cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0 }}>Resultado da <span style={{ color: 'var(--ios-teal)' }}>Consultoria</span></h1>
                    <p style={{ opacity: 0.5, margin: '4px 0 0 0' }}>Sincronize o desfecho com o CRM</p>
                </div>
            </div>

            {/* Lead Summary Card */}
            <div className="vox-card" style={{ background: 'rgba(0,0,0,0.03)', border: 'none', display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--ios-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900' }}>
                    {lead.name.charAt(0)}
                </div>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{lead.name}</h2>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', opacity: 0.6, fontSize: '13px', fontWeight: '800' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {lead.phone}</span>
                        <span style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '6px' }}>{lead.status.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {/* Major Decision */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>O que aconteceu nesta reunião?</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <button
                        onClick={() => { setResultType('attended'); setAttendedAction(null); }}
                        style={{
                            padding: '24px 12px', borderRadius: '20px', cursor: 'pointer', transition: '0.3s',
                            background: resultType === 'attended' ? 'var(--ios-teal)' : '#fff',
                            color: resultType === 'attended' ? '#fff' : '#000',
                            border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                        }}
                    >
                        <CheckCircle size={24} />
                        <span style={{ fontWeight: '900', fontSize: '14px' }}>Compareceu</span>
                    </button>
                    <button
                        onClick={() => setResultType('rescheduled')}
                        style={{
                            padding: '24px 12px', borderRadius: '20px', cursor: 'pointer', transition: '0.3s',
                            background: resultType === 'rescheduled' ? '#FF9500' : '#fff',
                            color: resultType === 'rescheduled' ? '#fff' : '#000',
                            border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                        }}
                    >
                        <CalendarClock size={24} />
                        <span style={{ fontWeight: '900', fontSize: '14px' }}>Reagendou</span>
                    </button>
                    <button
                        onClick={() => setResultType('no_show')}
                        style={{
                            padding: '24px 12px', borderRadius: '20px', cursor: 'pointer', transition: '0.3s',
                            background: resultType === 'no_show' ? '#FF3B30' : '#fff',
                            color: resultType === 'no_show' ? '#fff' : '#000',
                            border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                        }}
                    >
                        <XCircle size={24} />
                        <span style={{ fontWeight: '900', fontSize: '14px' }}>Ausente</span>
                    </button>
                </div>
            </div>

            {/* Conditional Sub-Logic */}
            {resultType === 'attended' && (
                <div className="animate-ios-pop" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Próxima Etapa no CRM</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <button
                            onClick={() => setAttendedAction('negotiation')}
                            style={{
                                padding: '20px', borderRadius: '20px', background: attendedAction === 'negotiation' ? 'rgba(0,122,255,0.1)' : '#fff',
                                border: attendedAction === 'negotiation' ? '2px solid #007AFF' : '1px solid #e5e5ea',
                                cursor: 'pointer', transition: '0.2s', textAlign: 'left'
                            }}
                        >
                            <div style={{ color: '#007AFF', marginBottom: '8px' }}><Briefcase size={20} /></div>
                            <div style={{ fontWeight: '900' }}>Em Negociação</div>
                            <div style={{ fontSize: '12px', opacity: 0.5 }}>Definir follow-up</div>
                        </button>
                        <button
                            onClick={() => setAttendedAction('enrollment')}
                            style={{
                                padding: '20px', borderRadius: '20px', background: attendedAction === 'enrollment' ? 'rgba(52,199,89,0.1)' : '#fff',
                                border: attendedAction === 'enrollment' ? '2px solid #34C759' : '1px solid #e5e5ea',
                                cursor: 'pointer', transition: '0.2s', textAlign: 'left'
                            }}
                        >
                            <div style={{ color: '#34C759', marginBottom: '8px' }}><GraduationCap size={20} /></div>
                            <div style={{ fontWeight: '900' }}>Iniciar Matrícula</div>
                            <div style={{ fontSize: '12px', opacity: 0.5 }}>Mover para GANHOS</div>
                        </button>
                    </div>
                </div>
            )}

            {/* Date Picker if needed */}
            {(resultType === 'rescheduled' || resultType === 'no_show' || (resultType === 'attended' && attendedAction === 'negotiation')) && (
                <div className="animate-ios-pop" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <h3 style={{ fontSize: '12px', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Agendar Retorno</h3>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e5e5ea', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Clock size={20} color="#8E8E93" />
                        <input
                            type="datetime-local"
                            className="input-field"
                            style={{ flex: 1, border: 'none', padding: 0, fontWeight: '800' }}
                            value={formData.nextDate}
                            onChange={e => setFormData({ ...formData, nextDate: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '900', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Observações do Consultor</h3>
                <textarea
                    className="input-field"
                    placeholder="O que foi conversado? Há alguma objeção?..."
                    style={{ minHeight: '120px', borderRadius: '20px', padding: '20px' }}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
            </div>

            {/* Master Action */}
            <button
                onClick={handleSave}
                disabled={!isFormValid() || loading}
                className="btn-primary"
                style={{ height: '60px', borderRadius: '20px', fontSize: '18px', gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', opacity: isFormValid() ? 1 : 0.4 }}
            >
                {loading ? 'Sincronizando...' : 'Confirmar e Atualizar CRM'} <ChevronRight size={20} />
            </button>

        </div>
    );
};

export default ConsultationResultPage;
