import React, { useState } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ManualMapper = () => {
    const headers = [
        "ID", "Lead título", "Empresa lead 's", "Contato principal", "Empresa do contato",
        "Lead usuário responsável", "Etapa do lead", "Funil de vendas", "Venda", "Data Criada",
        "Criado por", "Última modificação", "Modificado por", "Lead tags", "Próxima tarefa",
        "Fechada em", "Quantidade", "Curso de Interesse", "Temperatura", "Unidade", "SDR",
        "*Sobre o lead*", "Profissão", "Bairro", "*Marketing*", "Mídia", "Origem", "*Insucesso*",
        "Motivo de insucesso", "*Tentativas de contato*", "Resultado 1º tentativa",
        "Resultado 2º tentativa", "Resultado 3º tentativa", "Resultado 4º tentativa",
        "Resultado 5º tentativa", "Conexão realizada", "Data e hora da conexão",
        "Canal da conexão", "*1 Agendamento de entrevista*", "Data e hora da entrevista - 1",
        "Resultado entrevista - 1", "*2 Agendamento de entrevista*", "Data e hora da entrevista - 2",
        "Resultado entrevista - 2", "*3 Agendamento de entrevista*", "Data e hora da entrevista - 3",
        "Resultado entrevista - 3", "*4 Agendamento de entrevista*", "Data e hora da entrevista - 4",
        "Resultado entrevista - 4", "*Entrevista realizada*", "Tipo de entrevista",
        "Data e hora da entrevista Realizada", "*Visita*", "Visitou a unidade?",
        "Data e hora da visita", "*Aula Experimental*", "Agendamento aula experimental",
        "Assistiu a aula experimental?", "Facilitador da aula experimental", "*Cadência bolo*",
        "Follow Up 1", "Follow Up 2", "Follow Up 3", "Follow Up 4", "Follow Up 5",
        "*Cadência negociação*", "Follow Up 1", "Follow Up 2", "Follow Up 3", "Follow Up 4",
        "Follow Up 5", "Follow Up 6", "Follow Up 7", "*Registros de negociação*",
        "Data e hora da negociação", "Follow Up 5", "Motivo - Interesse do lead",
        "*Informações sobre pagamento*", "Forma de pagamento",
        "Qtd. de parcela (Cartão de crédito)", "Bandeira (Cartão de crédito)",
        "Venda com subsídio", "*Valores de pagamento*", "Valor da matrícula",
        "Valor do curso", "Valor material didático", "*Marketing*", "Tipo de lead",
        "Lead veio de ADS", "*Comercial*", "##SDR", "Encaminhado para vendedor",
        "Data encaminhado", "utm_content", "utm_medium", "utm_campaign", "utm_source",
        "utm_term", "utm_referrer", "referrer", "gclientid", "gclid", "fbclid",
        "Posição (contato)", "Email comercial (contato)", "Email pessoal (contato)",
        "Outro email (contato)", "Telefone comercial (contato)", "Tel. direto com. (contato)",
        "Celular (contato)", "Faz (contato)", "Telefone residencial (contato)",
        "Outro telefone (contato)", "CPF (contato)", "Data de nascimento (contato)",
        "Endereço (contato)", "RG (contato)", "Nota 1", "Nota 2", "Nota 3", "Nota 4", "Nota 5"
    ];

    const SYSTEM_FIELDS = [
        { key: 'ignore', label: '❌ Ignorar Coluna' },
        { key: 'origin_id_importado', label: '🆔 ID Original (Importado)' },
        { key: 'name', label: '👤 Nome do Lead' },
        { key: 'phone', label: '📱 WhatsApp / Celular' },
        { key: 'email', label: '📧 E-mail' },
        { key: 'profession', label: '💼 Profissão' },
        { key: 'neighborhood', label: '🏘️ Bairro' },
        { key: 'city', label: '🏙️ Cidade' },
        { key: 'address', label: '📍 Endereço' },
        { key: 'state', label: '🏳️ Estado (UF)' },
        { key: 'cep', label: '📬 CEP' },
        { key: 'cpf', label: '📄 CPF' },
        { key: 'rg', label: '📄 RG' },
        { key: 'birthDate', label: '🎂 Data de Nascimento' },
        { key: 'createdAt', label: '📅 Data de Criação' },
        { key: 'status', label: '📊 Etapa do Lead (Status)' },
        { key: 'observation', label: '📝 Observações / Notas' },
        { key: 'tags', label: '🏷️ Tags / Etiquetas' },
        { key: 'temperature', label: '🔥 Temperatura (Frio/Morno/Quente)' },
        { key: 'lossReason', label: '📉 Motivo de Perda' },
        { key: 'sales_value', label: '💰 Valor do Curso' },
        { key: 'enrollment_value', label: '💳 Valor da Matrícula' },
        { key: 'material_value', label: '📚 Preço do Material' },
        { key: 'payment_method', label: '💳 Forma de Pagamento' },
        { key: 'installments', label: '🔢 Parcelas' },
        { key: 'card_brand', label: '💳 Bandeira do Cartão' },
        { key: 'source', label: '🌐 Origem (Source)' },
        { key: 'media', label: '📢 Mídia (Medium)' },
        { key: 'utm_source', label: '🔗 UTM Source' },
        { key: 'utm_medium', label: '🔗 UTM Medium' },
        { key: 'utm_campaign', label: '🔗 UTM Campaign' },
        { key: 'utm_term', label: '🔗 UTM Term' },
        { key: 'utm_content', label: '🔗 UTM Content' },
        { key: 'courseInterest', label: '🎓 Interesse: Curso' },
        { key: 'responsible', label: '👤 Usuário Responsável' },
        { key: 'unit', label: '🏫 Unidade' },
        { key: 'funnel', label: '🌪️ Funil' },
        { key: 'updatedAt', label: '🔄 Última Modificação' },
        { key: 'nextActionAt', label: '⏭️ Próxima Tarefa' },
        { key: 'lastScheduleDate', label: '🗓️ Data Último Agendamento' },
        { key: 'consultancyDate', label: '🤝 Data da Reunião' },
        { key: 'enrollmentDate', label: '📝 Data da Matrícula' },
        { key: 'sdr_id', label: '👤 SDR Responsável' },
        { key: 'quantity', label: '🔢 Quantidade' },
        { key: 'company', label: '🏢 Empresa / Organização' },
        { key: 'secondary_phone', label: '📞 Telefone Secundário' },
        { key: 'secondary_email', label: '✉️ E-mail Secundário' },
        { key: 'position', label: '👔 Cargo / Posição' },
        { key: 'cnpj', label: '📄 CNPJ' },
        { key: 'organization_id', label: '🆔 ID da Organização' },
        { key: 'bank_code', label: '🏦 Código Bancário' },
        { key: 'real_address', label: '🏠 Endereço Real' },
        { key: 'connection_done', label: '✅ Conexão Realizada' },
        { key: 'connection_date', label: '📅 Data da Conexão' },
        { key: 'connection_channel', label: '📺 Canal da Conexão' }
    ];

    const [mapping, setMapping] = useState({});
    const [customFields, setCustomFields] = useState([]);
    const [newFieldName, setNewFieldName] = useState('');
    const [saved, setSaved] = useState(false);

    // Initial pre-fill logic
    React.useEffect(() => {
        const initial = {};
        const normalization = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        headers.forEach(h => {
            const hn = normalization(h);
            const found = SYSTEM_FIELDS.find(f => {
                if (f.key === 'ignore') return false;
                const ln = normalization(f.label);
                const kn = normalization(f.key);
                return hn === ln || hn.includes(ln) || ln.includes(hn) || hn === kn;
            });
            if (found) initial[h] = found.key;
        });
        setMapping(initial);
    }, []);

    const ALL_FIELDS = [...SYSTEM_FIELDS, ...customFields.map(f => ({ key: f, label: `✨ ${f} (Novo)` }))];

    const handleSelect = (header, value) => {
        setMapping(prev => ({ ...prev, [header]: value }));
    };

    const handleAddCustomField = () => {
        if (!newFieldName.trim()) return;
        const key = newFieldName.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');
        if (SYSTEM_FIELDS.find(f => f.key === key) || customFields.includes(key)) {
            alert('Este campo já existe!');
            return;
        }
        setCustomFields([...customFields, key]);
        setNewFieldName('');
    };

    const handleClone = (header) => {
        const clean = header.replace(/\*/g, '').trim();
        const key = clean.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');

        if (!customFields.includes(key) && !SYSTEM_FIELDS.find(f => f.key === key)) {
            setCustomFields(prev => [...prev, key]);
        }
        setMapping(prev => ({ ...prev, [header]: key }));
    };

    const saveMapping = async () => {
        try {
            await api.post('/crm/import/save-mapping', {
                mapping,
                customFields
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar mapeamento no servidor.');
        }
    };

    return (
        <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>Mapeamento de Leads</h1>
                        <p style={{ color: '#64748b' }}>Configure os campos para a importação. Use o botão <b>Clonar</b> para criar um novo campo idêntico ao da planilha.</p>
                    </div>
                    <button
                        onClick={saveMapping}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                    >
                        {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                        {saved ? 'Mapeamento Salvo!' : 'Salvar Configuração'}
                    </button>
                </div>

                <div style={{ marginBottom: '32px', padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', display: 'block', marginBottom: '4px' }}>CRIAR NOVO CAMPO MANUALMENTE</label>
                        <input
                            placeholder="Ex: Nome do Pai, Motivo do Desconto..."
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #93c5fd' }}
                        />
                    </div>
                    <button
                        onClick={handleAddCustomField}
                        style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                        + Adicionar
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                    {headers.map(header => (
                        <div key={header} style={{ display: 'grid', gridTemplateColumns: '1.5fr 40px 1.5fr', gap: '15px', alignItems: 'center', padding: '10px 16px', background: header.startsWith('*') ? '#f8fafc' : '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                            <span style={{ fontSize: '13px', fontWeight: header.startsWith('*') ? 'bold' : '500', color: header.startsWith('*') ? '#64748b' : '#334155' }}>
                                {header}
                            </span>

                            <button
                                onClick={() => handleClone(header)}
                                title="Criar campo idêntico no sistema"
                                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>

                            <select
                                value={mapping[header] || 'ignore'}
                                onChange={(e) => handleSelect(header, e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: mapping[header] && mapping[header] !== 'ignore' ? '#eff6ff' : '#fff', color: '#334155' }}
                            >
                                {ALL_FIELDS.map(f => (
                                    <option key={f.key} value={f.key}>{f.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '40px', position: 'sticky', bottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={saveMapping}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#2563eb', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
                    >
                        {saved ? <CheckCircle size={20} /> : <Save size={20} />}
                        {saved ? 'Mapeamento Salvo!' : 'Salvar Configuração'}
                    </button>
                </div>

                {saved && (
                    <div style={{ marginTop: '20px', padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={18} /> Mapeamento salvo! Agora volte ao chat para eu processar os dados.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManualMapper;
