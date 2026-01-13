import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    X, User, Phone, Mail, MapPin, Calendar, Clock, Save, DollarSign,
    FileText, Lock, Check, Tag, Calendar as CalendarIcon, ExternalLink,
    ChevronDown, ChevronRight, MessageCircle, Send, Trash2, PhoneMissed,
    PhoneOutgoing, Globe, Info, BarChart, Rocket, CreditCard
} from 'lucide-react';
import api from '../../services/api';

const LeadDetailsModal = ({ isOpen, onClose, lead, onSave, isReadOnly = false, initialTab = 'principal', user, consultants = [], units = [] }) => {
    const navigate = useNavigate();
    const chatEndRef = useRef(null);

    // Accordion States for the 7 sections
    const [accordions, setAccordions] = useState({
        essencial: true,
        contato: true,
        financeiro: false,
        localizacao: false,
        historico_importado: false,
        tracking: false,
        fluxo: false
    });

    const [leftTab, setLeftTab] = useState(initialTab || 'principal');
    const [noteInput, setNoteInput] = useState('');
    const [fullHistory, setFullHistory] = useState([]);

    const FUNNELS = {
        crm: {
            label: 'Comercial',
            stages: [
                { id: 'new', label: 'Novo Lead' }, { id: 'connecting', label: 'Conectando' }, { id: 'connected', label: 'Conexão' },
                { id: 'scheduled', label: 'Agendamento' }, { id: 'no_show', label: 'No-Show' }, { id: 'negotiation', label: 'Negociação' },
                { id: 'won', label: 'Matriculados' }, { id: 'closed_won', label: 'Closed - won' }, { id: 'closed_lost', label: 'Closed - lost' }, { id: 'closed', label: 'Encerrado' }, { id: 'nurturing', label: 'Nutrição' }
            ]
        },
        social: {
            label: 'Redes Sociais',
            stages: [{ id: 'social_comment', label: 'Novo Comentário' }, { id: 'social_direct', label: 'Novo Direct' }, { id: 'social_prospect', label: 'Prospects' }]
        },
        internal: {
            label: 'Interno',
            stages: [{ id: 'internal_students', label: 'Alunos' }, { id: 'internal_other', label: 'Outros' }, { id: 'internal_team', label: 'Time Interno' }]
        }
    };

    const [formData, setFormData] = useState({ ...lead });

    const loadFullDetails = async () => {
        if (!lead?.id) return;
        try {
            const res = await api.get(`/crm/leads/${lead.id}`);
            setFormData(res.data);
        } catch (e) {
            console.error("Error loading lead details:", e);
        }
    };

    useEffect(() => {
        if (isOpen && lead?.id) {
            loadFullDetails();
        } else {
            setFormData({ ...lead });
        }
    }, [isOpen, lead?.id]);

    // --- MASKING HELPERS ---
    const formatPhone = (v) => {
        if (!v) return '';
        v = v.replace(/\D/g, '');
        // If it starts with 55 and has 12 or 13 digits, it's a full BR number
        if (v.startsWith('55') && v.length >= 12) {
            if (v.length === 13) return v.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})/, '+$1 ($2) $3-$4');
            if (v.length === 12) return v.replace(/^(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');
        }
        // Fallback for standard 10/11 digits
        if (v.length > 11) v = v.substring(0, 11);
        if (v.length === 11) return v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        if (v.length === 10) return v.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        if (v.length > 2) return v.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        return v;
    };
    const formatCPF = (v) => {
        if (!v) return '';
        v = v.replace(/\D/g, '').substring(0, 11);
        return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
            .replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
            .replace(/(\d{3})(\d{3})/, '$1.$2');
    };
    const cleanNumber = (v) => v ? String(v).replace(/\D/g, '') : '';
    const formatCurrency = (v) => {
        if (!v) return 'R$ 0,00';
        const clean = String(v).replace(/\D/g, '');
        const num = parseFloat(clean) / 100;
        return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const parseCurrency = (v) => {
        if (!v) return null;
        if (typeof v === 'number') return v;
        return parseFloat(v.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    };

    const formatDate = (v) => {
        if (!v) return '';
        // If ISO string (YYYY-MM-DDTHH:mm:ss)
        if (typeof v === 'string' && v.includes('T')) {
            const [datePart, timePart] = v.split('T');
            const [y, m, d] = datePart.split('-');
            const time = timePart ? timePart.substring(0, 5) : '00:00';
            if (y && m && d) return `${d}/${m}/${y} ${time}`;
        }
        // If YYYY-MM-DD
        if (v.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d] = v.split('-');
            return `${d}/${m}/${y}`;
        }

        // Input Masking Logic (DD/MM/AAAA HH:mm)
        v = v.replace(/\D/g, ''); // numbers only
        if (v.length > 12) v = v.substring(0, 12); // limit length

        // Mask: 00/00/0000 00:00
        if (v.length > 8) return v.replace(/(\d{2})(\d{2})(\d{4})(\d{2})(\d{0,2})/, '$1/$2/$3 $4:$5');
        if (v.length > 4) return v.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
        if (v.length > 2) return v.replace(/(\d{2})(\d{2})/, '$1/$2');
        return v;
    };

    // ... (currency functions remain same)

    const parseDate = (v) => {
        if (!v) return null;
        // DD/MM/AAAA HH:mm -> YYYY-MM-DDTHH:mm:00
        if (v.match(/^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/)) {
            const [date, time] = v.split(' ');
            const [d, m, y] = date.split('/');
            return `${y}-${m}-${d}T${time}:00`;
        }
        // DD/MM/AAAA -> YYYY-MM-DD
        if (v.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const [d, m, y] = v.split('/');
            return `${y}-${m}-${d}`;
        }
        return v;
    };

    // ... (applyMasks logic needs to include new date fields now)

    const handleChange = (field, value) => {
        let v = value;
        if (['phone', 'whatsapp', 'secondary_phone', 'mobile', 'celular__contato_', 'telefone_comercial__contato_', 'telefone_residencial__contato_', 'outro_telefone__contato_', 'tel__direto_com___contato_', 'telefone___responsavel_financeiro'].includes(field)) v = formatPhone(v);
        if (['cpf', 'cpf__contato_', 'rg', 'rg__contato_', 'cpf___responsavel_financeiro', 'rg___responsavel_financeiro', 'cnpj'].includes(field)) v = v.replace(/[^\d.\-/]/g, '');

        if (['sales_value', 'enrollment_value', 'material_value', 'venda', 'valor_material_didatico'].includes(field)) v = formatCurrency(v);

        // Date Fields
        if (['birthDate', 'data_de_nascimento__contato_', 'data_vencimento',
            'createdAt', 'fechada_em', 'data_encaminhado', 'data_e_hora_da_negociacao',
            'consultancyDate', 'enrollmentDate', 'lastScheduleDate', 'data_de_nascimento___responsavel_financeiro',
            'connection_date', 'data_e_hora_da_entrevista___1', 'data_e_hora_da_entrevista___2',
            'data_e_hora_da_entrevista___3', 'data_e_hora_da_entrevista___4',
            'data_e_hora_da_entrevista_realizada', 'data_e_hora_da_visita', 'agendamento_aula_experimental'].includes(field)) {
            v = formatDate(v);
        }

        setFormData(prev => ({ ...prev, [field]: v }));
    };

    const toggleAccordion = (key) => {
        setAccordions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        try {
            const payload = { ...formData };
            // Unmask before save
            if (payload.phone) payload.phone = cleanNumber(payload.phone);
            if (payload.whatsapp) payload.whatsapp = cleanNumber(payload.whatsapp);
            if (payload.celular__contato_) payload.celular__contato_ = cleanNumber(payload.celular__contato_);
            if (payload.telefone_comercial__contato_) payload.telefone_comercial__contato_ = cleanNumber(payload.telefone_comercial__contato_);
            if (payload.telefone___responsavel_financeiro) payload.telefone___responsavel_financeiro = cleanNumber(payload.telefone___responsavel_financeiro);

            if (payload.cpf) payload.cpf = cleanNumber(payload.cpf);
            if (payload.cpf__contato_) payload.cpf__contato_ = cleanNumber(payload.cpf__contato_);
            if (payload.cnpj) payload.cnpj = cleanNumber(payload.cnpj);
            if (payload.cpf___responsavel_financeiro) payload.cpf___responsavel_financeiro = cleanNumber(payload.cpf___responsavel_financeiro);

            const dateFields = [
                'birthDate', 'data_de_nascimento__contato_', 'data_vencimento',
                'createdAt', 'fechada_em', 'data_encaminhado', 'data_e_hora_da_negociacao',
                'consultancyDate', 'enrollmentDate', 'lastScheduleDate', 'data_de_nascimento___responsavel_financeiro',
                'connection_date', 'data_e_hora_da_entrevista___1', 'data_e_hora_da_entrevista___2',
                'data_e_hora_da_entrevista___3', 'data_e_hora_da_entrevista___4',
                'data_e_hora_da_entrevista_realizada', 'data_e_hora_da_visita', 'agendamento_aula_experimental'
            ];
            dateFields.forEach(f => {
                if (payload[f]) payload[f] = parseDate(payload[f]);
            });

            if (payload.sales_value) payload.sales_value = parseCurrency(payload.sales_value);
            if (payload.venda) payload.venda = parseCurrency(payload.venda);
            if (payload.enrollment_value) payload.enrollment_value = parseCurrency(payload.enrollment_value);
            if (payload.valor_material_didatico) payload.valor_material_didatico = parseCurrency(payload.valor_material_didatico);

            // Map consultant_id to responsibleId for backend
            if (payload.consultant_id) payload.responsibleId = payload.consultant_id;

            if (onSave) onSave(payload);
            onClose();
        } catch (e) {
            console.error("Save error:", e);
            alert("Erro ao salvar lead");
        }
    };

    const handleAddNote = async () => {
        if (!noteInput.trim()) return;
        try {
            await api.post(`/crm/leads/${lead.id}/notes`, { content: noteInput });
            setNoteInput('');
            loadFullDetails();
        } catch (e) { console.error("Note error:", e); }
    };


    const getActivityFeed = () => {
        const history = typeof formData.history === 'string' ? JSON.parse(formData.history || '[]') : (formData.history || []);
        const attempts = typeof formData.attempts === 'string' ? JSON.parse(formData.attempts || '[]') : (formData.attempts || []);

        let feed = [
            ...history.map(h => ({ ...h, type: 'history' })),
            ...attempts.map(a => ({ ...a, type: 'attempt', timestamp: a.date }))
        ];

        if (formData.observation) {
            feed.push({
                type: 'note',
                content: formData.observation,
                user: 'Sistema (Import)',
                timestamp: formData.createdAt
            });
        }

        // Add Notes 1-5 if they exist
        [1, 2, 3, 4, 5].forEach(n => {
            const noteKey = `nota_${n}`;
            if (formData[noteKey]) {
                feed.push({
                    type: 'note',
                    content: `Nota ${n}: ${formData[noteKey]}`,
                    user: 'Sistema (Importado)',
                    timestamp: formData.createdAt
                });
            }
        });

        return feed.sort((a, b) => new Date(b.timestamp || b.date || b.createdAt) - new Date(a.timestamp || a.date || a.createdAt));
    };

    if (!isOpen || !formData) return null;

    const styles = {
        overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
        modal: { background: '#fff', width: '95vw', maxWidth: '1200px', height: '90vh', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
        header: { padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' },
        content: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 400px', overflow: 'hidden' },
        leftPanel: { overflowY: 'auto', borderRight: '1px solid #e2e8f0', background: '#fff' },
        rightPanel: { background: '#f1f5f9', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
        accordionBtn: { width: '100%', padding: '12px 16px', background: '#fff', border: 'none', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left' },
        accordionContent: { padding: '16px', borderBottom: '1px solid #f1f5f9' },
        inputWrapper: { marginBottom: '12px' },
        label: { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
        input: { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#1e293b', outline: 'none', transition: 'all 0.2s' },
        grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
        sectionTitle: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }
    };

    const renderInput = (label, field, type = "text", options = null) => {
        let val = formData[field] || '';

        // Ensure manual mask formatting for display if it's a date field treated as text
        // (Note: The `handleChange` handles the masking logic, so we just pass the value)
        // If the backend sends ISO, we might want to format it for initial display
        if (field === 'createdAt' || field === 'fechada_em' || field.includes('data_') || field.includes('Date')) {
            if (val && val.includes('T')) {
                val = formatDate(val); // Ensure DD/MM/YYYY HH:mm format for text input visualization
            }
        }

        return (
            <div style={styles.inputWrapper}>
                <label style={styles.label}>{label}</label>
                {options ? (
                    <select
                        value={val}
                        onChange={e => handleChange(field, e.target.value)}
                        style={styles.input}
                    >
                        <option value="">Selecione...</option>
                        {options.map(opt => {
                            const val = opt.id || opt;
                            const label = opt.label || opt.name || opt;
                            return (
                                <option key={val} value={val}>{typeof label === 'object' ? JSON.stringify(label) : label}</option>
                            );
                        })}
                    </select>
                ) : (
                    <input
                        type={type === 'datetime-local' ? 'text' : type} // FORCE TEXT to avoid American format
                        value={val}
                        onChange={e => handleChange(field, e.target.value)}
                        style={styles.input}
                        placeholder={type === 'datetime-local' ? 'DD/MM/AAAA HH:mm' : ''}
                    />
                )}
            </div>
        );
    };


    const handleAdDataChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            adData: {
                ...(prev.adData || {}),
                [field]: value
            }
        }));
    };

    const renderAdDataInput = (label, field) => {
        const adData = formData.adData || {};
        const val = adData[field] || '';

        return (
            <div style={styles.inputWrapper}>
                <label style={styles.label}>{label}</label>
                <input
                    type="text"
                    value={val}
                    onChange={e => handleAdDataChange(field, e.target.value)}
                    style={styles.input}
                />
            </div>
        );
    };

    return createPortal(
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* HEADER */}
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#3b82f6', color: '#fff', padding: '8px', borderRadius: '12px' }}>
                            <User size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{formData.name}</h2>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>ID #{formData.id} • {formData.funnel?.toUpperCase()} • {formData.status?.toUpperCase()}</p>

                            {/* Phone Display in Header */}
                            {(() => {
                                const validPhone = [
                                    formData.phone,
                                    formData.secondary_phone,
                                    formData.mobile,
                                    formData.whatsapp,
                                    formData['celular__contato_'],
                                    formData['telefone_comercial__contato_'],
                                    formData['telefone_residencial__contato_'],
                                    formData['outro_telefone__contato_'],
                                    formData['tel__direto_com___contato_']
                                ].find(p => p && String(p).replace(/\D/g, '').length > 5 && String(p).replace(/\D/g, '') !== '0000000000');

                                return (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>
                                            <Phone size={14} />
                                            {validPhone || 'Sem telefone'}
                                        </div>
                                        {validPhone && (
                                            <a
                                                href={`https://wa.me/55${String(validPhone).replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}
                                            >
                                                <MessageCircle size={12} /> WhatsApp
                                            </a>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                            <Save size={16} /> Salvar Alterações
                        </button>
                        <button onClick={onClose} style={{ padding: '8px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* CONTENT */}
                <div style={styles.content}>
                    {/* LEFT: FORM DATA */}
                    <div style={styles.leftPanel}>

                        {/* 1. ESSENCIAL & COMERCIAL */}
                        <button onClick={() => toggleAccordion('essencial')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#2563eb' }}><BarChart size={16} /> Essencial e Comercial</span>
                            {accordions.essencial ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.essencial && (
                            <div style={styles.accordionContent}>
                                <div style={styles.grid2}>
                                    {renderInput("Status/Etapa", "status", "select", (FUNNELS[formData.funnel || 'crm'] || FUNNELS.crm).stages)}
                                    {renderInput("Temperatura", "temperature", "select", [
                                        { id: 'hot', label: '🔥 Quente' },
                                        { id: 'warm', label: '⛅ Morna' },
                                        { id: 'cold', label: '❄️ Fria' }
                                    ])}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Unidade", "unitId", "select", units)}
                                    {renderInput("Responsável", "consultant_id", "select", consultants)}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("SDR", "sdr_id", "select", consultants)}
                                    {renderInput("Quantidade", "quantity", "number")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Funil", "funnel", "select", Object.keys(FUNNELS).map(k => ({ id: k, label: FUNNELS[k].label })))}
                                    {renderInput("Tags / Etiquetas", "tags")}
                                </div>
                            </div>
                        )}

                        {/* 2. IDENTIFICAÇÃO & CONTATO */}
                        <button onClick={() => toggleAccordion('contato')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#e11d48' }}><Phone size={16} /> Identificação e Contato</span>
                            {accordions.contato ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.contato && (
                            <div style={styles.accordionContent}>
                                {renderInput("Nome Completo", "name")}
                                <div style={styles.grid2}>
                                    {renderInput("WhatsApp Principal", "phone")}
                                    {renderInput("E-mail", "email")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Empresa", "company")}
                                    {renderInput("CNPJ", "cnpj")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("ID da Organização", "organization_id")}
                                    {renderInput("Cargo / Posição", "posicao__contato_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Profissão", "profession")}
                                    {renderInput("CPF", "cpf__contato_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("RG", "rg__contato_")}
                                    {renderInput("Telefone Comercial", "telefone_comercial__contato_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Celular (contato)", "celular__contato_")}
                                    {renderInput("Fone Residencial", "telefone_residencial__contato_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("E-mail Comercial", "email_comercial__contato_")}
                                    {renderInput("Email Pessoal", "email_pessoal__contato_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Outro Email", "outro_email__contato_")}
                                    {renderInput("Tel. Direto", "tel__direto_com___contato_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Outro Telefone", "outro_telefone__contato_")}
                                    {renderInput("Faz (Contato)", "faz__contato_")}
                                </div>
                            </div>
                        )}

                        {/* 3. FINANCEIRO & VENDA */}
                        <button onClick={() => toggleAccordion('financeiro')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#166534' }}><DollarSign size={16} /> Financeiro e Venda</span>
                            {accordions.financeiro ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.financeiro && (
                            <div style={styles.accordionContent}>
                                <div style={styles.grid2}>
                                    {renderInput("Valor do Curso", "sales_value")}
                                    {renderInput("Venda (Bruto)", "venda")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Valor da Matrícula", "enrollment_value")}
                                    {renderInput("Valor Material", "valor_material_didatico")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Forma de Pagamento", "payment_method")}
                                    {renderInput("Parcelas", "qtd__de_parcela__cartao_de_credito_")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Bandeira Cartão", "bandeira__cartao_de_credito_")}
                                    {renderInput("Venda com Subsídio", "venda_com_subsidio")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Data de Vencimento", "data_vencimento")}
                                    {renderInput("Código do Banco", "bank_code")}
                                </div>
                                {renderInput("Valores de Pagamento (Extra)", "valores_de_pagamento")}

                                <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                    <label style={{ ...styles.label, color: '#166534' }}>Responsável Financeiro (Tutor/Pagador)</label>
                                    {renderInput("Nome do Responsável", "responsibleName")}
                                    <div style={styles.grid2}>
                                        {renderInput("CPF do Responsável", "cpf___responsavel_financeiro")}
                                        {renderInput("RG do Responsável", "rg___responsavel_financeiro")}
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderInput("E-mail Financeiro", "email___responsavel_financeiro")}
                                        {renderInput("Tel. Financeiro", "telefone___responsavel_financeiro")}
                                    </div>
                                    {renderInput("Nascimento Responsável", "data_de_nascimento___responsavel_financeiro")}
                                </div>

                                <div style={{ ...styles.inputWrapper, marginTop: '16px' }}>
                                    <label style={styles.label}>Informações Adicionais Pagto</label>
                                    <textarea value={formData.informacoes_sobre_pagamento || ''} onChange={e => handleChange('informacoes_sobre_pagamento', e.target.value)} style={{ ...styles.input, minHeight: '60px' }} />
                                </div>
                            </div>
                        )}

                        {/* 4. LOCALIZAÇÃO */}
                        <button onClick={() => toggleAccordion('localizacao')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#d97706' }}><MapPin size={16} /> Localização</span>
                            {accordions.localizacao ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.localizacao && (
                            <div style={styles.accordionContent}>
                                <div style={styles.grid2}>
                                    {renderInput("Bairro", "neighborhood")}
                                    {renderInput("Cidade", "city")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Estado (UF)", "state")}
                                    {renderInput("CEP", "cep")}
                                </div>
                                {renderInput("Logradouro (Planilha)", "endereco__contato_")}
                                {renderInput("Endereço Real", "real_address")}
                                {renderInput("Endereço Completo", "address")}
                            </div>
                        )}

                        {/* 5. HISTÓRICO IMPORTADO & FOLLOW-UPS */}
                        <button onClick={() => toggleAccordion('historico_importado')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#4b5563' }}><FileText size={16} /> Histórico Importado e Follow-Ups</span>
                            {accordions.historico_importado ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.historico_importado && (
                            <div style={styles.accordionContent}>
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    {[1, 2, 3, 4, 5].map(n => (
                                        <div key={n} style={{ marginBottom: '12px' }}>
                                            <label style={styles.label}>Nota {n}</label>
                                            <div style={{ padding: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', color: '#334155' }}>
                                                {formData[`nota_${n}`] || '--'}
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                        <label style={{ ...styles.label, color: '#2563eb' }}>Cadeia de Follow-Ups e Negociação</label>

                                        <div style={{ marginBottom: '12px', padding: '8px', background: '#e0f2fe', borderRadius: '6px' }}>
                                            {renderInput("Cadência Bolo", "cadencia_bolo")}
                                        </div>

                                        <div style={styles.grid2}>
                                            {renderInput("Follow Up 1", "follow_up_1")}
                                            {renderInput("Follow Up 2", "follow_up_2")}
                                        </div>
                                        <div style={styles.grid2}>
                                            {renderInput("Follow Up 3", "follow_up_3")}
                                            {renderInput("Follow Up 4", "follow_up_4")}
                                        </div>
                                        {renderInput("Follow Up 5", "follow_up_5")}
                                        <div style={{ marginTop: '12px', padding: '8px', background: '#dcfce7', borderRadius: '6px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#166534', marginBottom: '8px', textTransform: 'uppercase' }}>Fase de Negociação</div>
                                            {renderInput("Cadência Negociação", "cadencia_negociacao")}
                                            {renderInput("Registros de Negociação", "registros_de_negociacao")}

                                            <div style={styles.grid2}>
                                                {renderInput("Follow Up 6", "follow_up_6")}
                                                {renderInput("Follow Up 7", "follow_up_7")}
                                            </div>

                                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(22, 101, 52, 0.1)', paddingTop: '8px' }}>
                                                <div style={styles.grid2}>
                                                    {renderInput("Negociação 1", "negociacao_1")}
                                                    {renderInput("Negociação 2", "negociacao_2")}
                                                </div>
                                                <div style={styles.grid2}>
                                                    {renderInput("Negociação 3", "negociacao_3")}
                                                    {renderInput("Negociação 4", "negociacao_4")}
                                                </div>
                                                {renderInput("Negociação 5", "negociacao_5")}
                                            </div>

                                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(22, 101, 52, 0.1)', paddingTop: '8px' }}>
                                                <div style={styles.grid2}>
                                                    {renderInput("Follow Up 1 (N2)", "follow_up_1_2")}
                                                    {renderInput("Follow Up 2 (N2)", "follow_up_2_2")}
                                                </div>
                                                <div style={styles.grid2}>
                                                    {renderInput("Follow Up 3 (N2)", "follow_up_3_2")}
                                                    {renderInput("Follow Up 4 (N2)", "follow_up_4_2")}
                                                </div>
                                                {renderInput("Follow Up 5 (N2)", "follow_up_5_2")}
                                            </div>

                                            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(22, 101, 52, 0.1)', paddingTop: '8px' }}>
                                                <div style={styles.grid2}>
                                                    {renderInput("Follow Up 1 (N3)", "follow_up_1_3")}
                                                    {renderInput("Follow Up 2 (N3)", "follow_up_2_3")}
                                                </div>
                                                <div style={styles.grid2}>
                                                    {renderInput("Follow Up 3 (N3)", "follow_up_3_3")}
                                                    {renderInput("Follow Up 4 (N3)", "follow_up_4_3")}
                                                </div>
                                                {renderInput("Follow Up 5 (N3)", "follow_up_5_3")}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                                        <label style={{ ...styles.label, color: '#d97706' }}>Tentativas de Contato</label>
                                        {renderInput("Log de Tentativas", "tentativas_de_contato")}
                                        <div style={styles.grid2}>
                                            {renderInput("Resultado 1", "resultado_1__tentativa")}
                                            {renderInput("Resultado 2", "resultado_2__tentativa")}
                                        </div>
                                        <div style={styles.grid2}>
                                            {renderInput("Resultado 3", "resultado_3__tentativa")}
                                            {renderInput("Resultado 4", "resultado_4__tentativa")}
                                        </div>
                                        {renderInput("Resultado 5", "resultado_5__tentativa")}
                                    </div>
                                </div>
                                <div style={{ marginTop: '16px', padding: '12px', background: '#f1f5f9', borderRadius: '8px' }}>
                                    <label style={styles.label}>Metadados do Sistema</label>
                                    <div style={styles.grid2}>
                                        {renderInput("Criado Por", "criado_por")}
                                        {renderInput("Modificado Por", "modificado_por")}
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderInput("Data de Criação", "createdAt", "datetime-local")}
                                        {renderInput("Fechada em", "fechada_em", "datetime-local")}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 6. FLUXO DE ATENDIMENTO */}
                        <button onClick={() => toggleAccordion('fluxo')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#7c3aed' }}><Rocket size={16} /> Fluxo de Atendimento</span>
                            {accordions.fluxo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.fluxo && (
                            <div style={styles.accordionContent}>
                                <div style={{ borderLeft: '2px solid #7c3aed', paddingLeft: '16px' }}>
                                    {renderInput("ID Original (Importado)", "origin_id_importado")}
                                    {renderInput("Sobre o Lead", "sobre_o_lead")}
                                    <div style={styles.grid2}>
                                        {renderInput("Curso de Interesse", "courseInterest")}
                                        {renderInput("Mídia", "media")}
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderInput("Motivo Insucesso", "lossReason")}
                                        {renderInput("Insucesso (Extra)", "insucesso")}
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderInput("Conexão Realizada?", "connection_done", "select", ["Não", "Sim"])}
                                        {renderInput("Canal da Conexão", "connection_channel")}
                                    </div>
                                    {renderInput("Data da Conexão", "connection_date", "datetime-local")}

                                    {renderInput("Motivo Interesse Lead", "motivo___interesse_do_lead")}

                                    <div style={styles.grid2}>
                                        {renderInput("Data da Consultoria", "consultancyDate")}
                                        {renderInput("Data da Matrícula", "enrollmentDate")}
                                    </div>
                                    {renderInput("Data Último Agendamento", "lastScheduleDate")}

                                    <label style={{ ...styles.label, marginTop: '12px' }}>Entrevistas e Agendamentos</label>
                                    {[1, 2, 3, 4].map(n => (
                                        <div key={n} style={{ marginBottom: '8px', borderBottom: '1px dashed #e2e8f0', paddingBottom: '8px' }}>
                                            <div style={styles.grid2}>
                                                {renderInput(`Agendamento ${n}`, `${n}_agendamento_de_entrevista`)}
                                                {renderInput(`Data/Hora ${n}`, `data_e_hora_da_entrevista___${n}`)}
                                            </div>
                                            {renderInput(`Resultado ${n}`, `resultado_entrevista___${n}`)}
                                        </div>
                                    ))}

                                    <div style={styles.grid2}>
                                        {renderInput("Tipo Entrevista", "tipo_de_entrevista")}
                                        {renderInput("Entrevista Realizada?", "entrevista_realizada")}
                                    </div>
                                    {renderInput("Data/Hora Realizada", "data_e_hora_da_entrevista_realizada")}

                                    <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                        <div style={styles.grid2}>
                                            {renderInput("Visita Unidade?", "visitou_a_unidade_")}
                                            {renderInput("Data da Visita", "data_e_hora_da_visita")}
                                        </div>
                                        {renderInput("Visita (Extra)", "visita")}
                                    </div>

                                    <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                        <div style={styles.grid2}>
                                            {renderInput("Aula Exp. Assistida?", "assistiu_a_aula_experimental_")}
                                            {renderInput("Facilitador Aula", "facilitador_da_aula_experimental")}
                                        </div>
                                        {renderInput("Agendamento Aula", "agendamento_aula_experimental")}
                                        {renderInput("Aula Exp (Extra)", "aula_experimental")}
                                    </div>

                                    <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                        {renderInput("Encaminhado para Vendedor", "encaminhado_para_vendedor")}
                                        {renderInput("Data Encaminhado", "data_encaminhado", "datetime-local")}
                                        {renderInput("Data/Hora Negociação", "data_e_hora_da_negociacao", "datetime-local")}
                                        <div style={styles.grid2}>
                                            {renderInput("Criado Por", "criado_por")}
                                            {renderInput("Modificado Por", "modificado_por")}
                                        </div>
                                        {renderInput("SDR Especial", "__sdr")}
                                        {renderInput("Comercial (Extra)", "comercial")}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 7. TRACKING & WEB */}
                        <button onClick={() => toggleAccordion('tracking')} style={styles.accordionBtn}>
                            <span style={{ ...styles.sectionTitle, color: '#0891b2' }}><Globe size={16} /> Tracking e Web (UTMs)</span>
                            {accordions.tracking ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {accordions.tracking && (
                            <div style={styles.accordionContent}>
                                <div style={{ marginBottom: '16px', background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#0369a1', fontWeight: 'bold', fontSize: '13px' }}>
                                        <Rocket size={16} /> Dados de Anúncio (Conversion Tracking)
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderAdDataInput("Origem do Anúncio", "source")}
                                        {renderAdDataInput("ID da Campanha", "campaignId")}
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderAdDataInput("ID do Conjunto", "adGroupId")}
                                        {renderAdDataInput("ID do Criativo", "adId")}
                                    </div>
                                    <div style={styles.grid2}>
                                        {renderAdDataInput("Google Click ID (GCLID)", "gclid")}
                                        {renderAdDataInput("Facebook Click ID (FBCLID)", "fbclid")}
                                    </div>
                                </div>

                                <div style={styles.grid2}>
                                    {renderInput("UTM Source", "utm_source")}
                                    {renderInput("UTM Medium", "utm_medium")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("UTM Campaign", "utm_campaign")}
                                    {renderInput("UTM Content", "utm_content")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("UTM Term", "utm_term")}
                                    {renderInput("UTM Referrer", "utm_referrer")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Gclid (Legacy)", "gclid")}
                                    {renderInput("GclientId", "gclientid")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Fbclid (Legacy)", "fbclid")}
                                    {renderInput("*Marketing_2*", "Marketing_2")}
                                </div>
                                <div style={styles.grid2}>
                                    {renderInput("Referrer", "referrer")}
                                </div>
                                {renderInput("Tipo de Lead", "tipo_de_lead")}
                                {renderInput("Lead veio de Ads?", "lead_veio_de_ads")}
                                {renderInput("Marketing (Extra)", "marketing")}
                            </div>
                        )}

                    </div>

                    {/* RIGHT: ACTIVITY FEED */}
                    <div style={styles.rightPanel}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Histórico de Atividade</h3>
                        </div>

                        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {getActivityFeed().map((item, idx) => (
                                <div key={idx} style={{
                                    background: item.type === 'note' ? '#fffbeb' : '#fff',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>{item.user || 'Sistema'}</span>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{new Date(item.timestamp || item.date).toLocaleString('pt-BR')}</span>
                                    </div>
                                    <p style={{ fontSize: '13px', margin: 0, color: '#334155' }}>{item.content || item.comment || item.result}</p>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* QUICK NOTE INPUT */}
                        <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                            <input
                                value={noteInput}
                                onChange={e => setNoteInput(e.target.value)}
                                placeholder="Adicionar nota rápida..."
                                style={{ ...styles.input, flex: 1 }}
                                onKeyPress={e => e.key === 'Enter' && handleAddNote()}
                            />
                            <button onClick={handleAddNote} style={{ padding: '8px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >,
        document.body
    );
};

export default LeadDetailsModal;
