import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, QrCode, Upload, Play, Pause, Filter, Check, RefreshCw, Send, Database, X, MapPin, Tag, List } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DataCard from '../../components/DataCard';
import { VoxModal } from '../../components/VoxUI';

const WhatsAppMarketing = () => {
    const { user } = useAuth();

    // -- STATES --
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);
    const [csvData, setCsvData] = useState([]);
    const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, tudo bem?');
    const [previewMessage, setPreviewMessage] = useState('');
    const [isLoadingCRM, setIsLoadingCRM] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [crmFilters, setCrmFilters] = useState({ status: '', tag: '', unit: '' });
    const [isSending, setIsSending] = useState(false);
    const [sentCount, setSentCount] = useState(0);
    const [dailyLimit] = useState(200);
    const [logs, setLogs] = useState([]);
    const [nextSendTime, setNextSendTime] = useState(null);

    const sendingRef = useRef(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        const storedDate = localStorage.getItem('wa_last_date');
        const today = new Date().toDateString();
        if (storedDate === today) {
            setSentCount(parseInt(localStorage.getItem('wa_daily_count') || '0'));
        } else {
            localStorage.setItem('wa_last_date', today);
            localStorage.setItem('wa_daily_count', '0');
            setSentCount(0);
        }
    }, []);

    useEffect(() => {
        const contact = csvData.length > 0 ? csvData[0] : { nome: 'João (Exemplo)', telefone: '11999999999' };
        setPreviewMessage(processSpintax(replaceVariables(messageTemplate, contact)));
    }, [messageTemplate, csvData]);

    const executeCrmImport = async () => {
        setIsLoadingCRM(true);
        addLog('Buscando leads no CRM...');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao buscar leads');
            const data = await res.json();
            const filteredData = data.filter(l => (l.contact?.phone || l.phone));
            const mappedLeads = filteredData.map(l => ({
                nome: l.contact?.name || l.name || 'Sem Nome',
                telefone: (l.contact?.phone || l.phone).replace(/\D/g, ''),
                origem: 'CRM'
            }));
            setCsvData(mappedLeads);
            addLog(`Sucesso! ${mappedLeads.length} contatos importados.`);
            setIsFilterModalOpen(false);
        } catch (error) {
            addLog('Erro ao carregar leads do CRM.');
        } finally {
            setIsLoadingCRM(false);
        }
    };

    const processSpintax = (text) => text.replace(/\{([^{}]+)\}/g, (m, c) => c.includes(';') ? c.split(';')[Math.floor(Math.random() * c.split(';').length)] : m);
    const replaceVariables = (text, contact) => {
        let newText = text;
        Object.keys(contact).forEach(key => {
            newText = newText.replace(new RegExp(`{${key}}`, 'gi'), contact[key]);
        });
        return newText;
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const lines = event.target.result.split('\n');
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                return { nome: values[0]?.trim(), telefone: values[1]?.trim() };
            }).filter(c => c.telefone);
            setCsvData(data);
            addLog(`CSV carregado com ${data.length} contatos.`);
        };
        reader.readAsText(file);
    };

    const addLog = (msg) => setLogs(p => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...p]);

    const startQueue = () => {
        if (connectionStatus !== 'connected') return alert('Conecte o WhatsApp primeiro!');
        setIsSending(true);
        sendingRef.current = true;
        processQueue();
    };

    const stopQueue = () => {
        setIsSending(false);
        sendingRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        addLog('Disparos pausados.');
    };

    const processQueue = async () => {
        if (!sendingRef.current) return;
        const currentCount = parseInt(localStorage.getItem('wa_daily_count') || '0');
        if (currentCount >= dailyLimit) { stopQueue(); return; }
        const contact = csvData[currentCount % csvData.length];
        if (!contact) { stopQueue(); return; }
        addLog(`Enviando para ${contact.nome}...`);
        timeoutRef.current = setTimeout(() => {
            if (!sendingRef.current) return;
            const newCount = currentCount + 1;
            setSentCount(newCount);
            localStorage.setItem('wa_daily_count', newCount.toString());
            addLog(`✅ Enviado para ${contact.nome}!`);
            processQueue();
        }, 3000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '40px' }}>

            {/* Grid Superior */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

                {/* Status da Conexão */}
                <DataCard title="WhatsApp" subtitle="Status do Serviço" variant={connectionStatus === 'connected' ? 'teal' : 'white'}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '20px 0' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '22px',
                            background: connectionStatus === 'connected' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: connectionStatus === 'connected' ? '#fff' : '#8E8E93'
                        }}>
                            {connectionStatus === 'connected' ? <Smartphone size={32} /> : <QrCode size={32} />}
                        </div>
                        <h4 style={{ fontWeight: '900', color: connectionStatus === 'connected' ? '#fff' : '#000' }}>
                            {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
                        </h4>
                        <button
                            onClick={() => connectionStatus === 'connected' ? setConnectionStatus('disconnected') : setConnectionStatus('connected')}
                            style={{
                                padding: '8px 16px', borderRadius: '12px', border: 'none',
                                background: connectionStatus === 'connected' ? 'rgba(255,255,255,0.2)' : 'var(--ios-teal)',
                                color: '#fff', fontWeight: '800', cursor: 'pointer'
                            }}
                        >
                            {connectionStatus === 'connected' ? 'Desconectar' : 'Conectar Agora'}
                        </button>
                    </div>
                </DataCard>

                {/* Monitoramento em Tempo Real */}
                <DataCard title="Monitoramento" subtitle={`Progresso: ${sentCount}/${dailyLimit}`}>
                    <div style={{
                        height: '160px', overflowY: 'auto', background: 'rgba(0,0,0,0.02)',
                        borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px'
                    }}>
                        {logs.length === 0 ? <p style={{ opacity: 0.3, fontSize: '13px', textAlign: 'center', marginTop: '50px' }}>Aguardando atividades...</p> :
                            logs.map((log, i) => (
                                <div key={i} style={{ fontSize: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.03)', color: log.includes('✅') ? '#34C759' : '#1C1C1E' }}>
                                    {log}
                                </div>
                            ))
                        }
                    </div>
                </DataCard>

                {/* Audiência */}
                <DataCard title="Audiência" subtitle={`${csvData.length} contatos na fila`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'center' }}>
                        <button
                            onClick={() => setIsFilterModalOpen(true)}
                            style={{
                                width: '100%', padding: '16px', borderRadius: '18px', border: '1px solid rgba(0,0,0,0.1)',
                                background: '#fff', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center'
                            }}
                        >
                            <Filter size={18} /> Filtrar do CRM
                        </button>
                        <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: '900', color: '#8E8E93' }}>OU</div>
                        <input type="file" id="bulk-upload" hidden onChange={handleFileUpload} />
                        <label htmlFor="bulk-upload" style={{
                            width: '100%', padding: '12px', borderRadius: '18px', border: '2px dashed rgba(0,0,0,0.1)',
                            textAlign: 'center', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#8E8E93'
                        }}>
                            Upload de Planilha CSV
                        </label>
                    </div>
                </DataCard>
            </div>

            {/* Editor de Mensagem */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="vox-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontWeight: '900' }}>Compor Mensagem</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['nome', 'telefone'].map(tag => (
                                <button key={tag} onClick={() => setMessageTemplate(p => p + ` {${tag}}`)} style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', border: 'none', fontSize: '10px', fontWeight: '900', cursor: 'pointer' }}>
                                    +{tag.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        value={messageTemplate}
                        onChange={e => setMessageTemplate(e.target.value)}
                        style={{ width: '100%', height: '200px', padding: '16px', borderRadius: '16px', background: 'rgba(0,0,0,0.02)', border: 'none', fontSize: '15px', resize: 'none' }}
                        placeholder="Olá {nome}, como vai?"
                    />
                </div>

                <div className="vox-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div>
                        <h3 style={{ fontWeight: '900', marginBottom: '8px' }}>Prévia Real</h3>
                        <div style={{
                            padding: '16px', borderRadius: '16px', background: '#DCF8C6', color: '#000',
                            fontSize: '14px', position: 'relative', maxWidth: '80%', marginLeft: '10px'
                        }}>
                            <div style={{
                                position: 'absolute', left: '-8px', top: '10px', width: '20px', height: '20px',
                                background: '#DCF8C6', transform: 'rotate(45deg)', borderRadius: '2px'
                            }} />
                            {previewMessage}
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        {isSending ? (
                            <button onClick={stopQueue} className="btn-primary" style={{ width: '100%', background: '#FF3B30', height: '60px', fontSize: '18px' }}>
                                <Pause size={20} /> Pausar Disparos
                            </button>
                        ) : (
                            <button
                                onClick={startQueue}
                                className="btn-primary"
                                style={{ width: '100%', height: '60px', fontSize: '18px' }}
                                disabled={sentCount >= dailyLimit || connectionStatus !== 'connected' || csvData.length === 0}
                            >
                                <Send size={20} /> Iniciar Campanha
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Filtro */}
            {isFilterModalOpen && (
                <VoxModal
                    isOpen={true}
                    onClose={() => setIsFilterModalOpen(false)}
                    title="Filtrar Contatos"
                    footer={
                        <button onClick={executeCrmImport} className="btn-primary" style={{ width: '100%' }}>Importar Selecionados</button>
                    }
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Status do CRM</label>
                            <select style={{ width: '100%', marginTop: '4px' }}>
                                <option>Todos os Leads</option>
                                <option>Novos</option>
                                <option>Agendados</option>
                                <option>Matriculados</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Tag do Lead</label>
                            <input type="text" placeholder="Ex: Lead Quente" style={{ width: '100%', marginTop: '4px' }} />
                        </div>
                    </div>
                </VoxModal>
            )}

        </div>
    );
};

export default WhatsAppMarketing;
