import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, QrCode, Upload, Play, Pause, AlertTriangle, Check, MessageSquare, Terminal, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const WhatsAppMarketing = () => {
    const { user } = useAuth();

    // -- STATES --
    // Connection
    const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected
    const [qrCode, setQrCode] = useState(null);
    const [pairingCode, setPairingCode] = useState('');

    // Campaign
    const [csvData, setCsvData] = useState([]);
    const [messageTemplate, setMessageTemplate] = useState('Olá {nome}, tudo bem?');
    const [previewMessage, setPreviewMessage] = useState('');

    // Sending Engine
    const [isSending, setIsSending] = useState(false);
    const [sentCount, setSentCount] = useState(0);
    const [dailyLimit] = useState(200);
    const [logs, setLogs] = useState([]);
    const [nextSendTime, setNextSendTime] = useState(null);

    const sendingRef = useRef(false);
    const timeoutRef = useRef(null);

    // -- EFFECTS --

    // Load daily count from localStorage (Simulating DB for Prototype)
    useEffect(() => {
        const storedDate = localStorage.getItem('wa_last_date');
        const today = new Date().toDateString();

        if (storedDate === today) {
            const count = parseInt(localStorage.getItem('wa_daily_count') || '0');
            setSentCount(count);
        } else {
            localStorage.setItem('wa_last_date', today);
            localStorage.setItem('wa_daily_count', '0');
            setSentCount(0);
        }

        loadLeadsMock();
    }, []);

    const loadLeadsMock = () => {
        // Fallback Mock Data as requested by user
        const MOCK_LEADS = [
            { nome: 'Cliente Teste 1', telefone: '5511999999999', tags: 'Interesse, Frio' },
            { nome: 'Cliente Teste 2', telefone: '5511888888888', tags: 'Novo' },
            { nome: 'Cliente Teste 3', telefone: '5511777777777', tags: 'Retorno' }
        ];
        // Only load mock if empty to allow CSV override
        if (csvData.length === 0) {
            setCsvData(MOCK_LEADS);
            addLog('Lista de leads carregada automaticamente (Mock).');
        } else {
            addLog('Lista atualizada.');
        }
    };

    // Update Preview when template changes
    useEffect(() => {
        if (csvData.length > 0) {
            const fakeContact = csvData[0];
            setPreviewMessage(processSpintax(replaceVariables(messageTemplate, fakeContact)));
        } else {
            setPreviewMessage(processSpintax(replaceVariables(messageTemplate, { nome: 'João (Exemplo)' })));
        }
    }, [messageTemplate, csvData]);

    // -- LOGIC --

    // Spintax Processor
    const processSpintax = (text) => {
        return text.replace(/\{([^{}]+)\}/g, (match, content) => {
            if (content.includes(';')) {
                const options = content.split(';');
                return options[Math.floor(Math.random() * options.length)];
            }
            return match; // Return as is if it's a variable reference (handled separately or before)
        });
    };

    // Variable Replacer
    const replaceVariables = (text, contact) => {
        let newText = text;
        Object.keys(contact).forEach(key => {
            const regex = new RegExp(`{${key}}`, 'gi');
            newText = newText.replace(regex, contact[key]);
        });
        return newText;
    };

    // CSV Parser (Simple implementation)
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const data = [];
            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const values = lines[i].split(',');
                const obj = {};
                headers.forEach((h, index) => {
                    obj[h] = values[index]?.trim();
                });
                if (obj.telefone) data.push(obj);
            }
            setCsvData(data);
            addLog(`CSV carregado com ${data.length} contatos.`);
        };
        reader.readAsText(file);
    };

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    // Sending Engine
    const startQueue = () => {
        if (connectionStatus !== 'connected') {
            alert('Conecte o WhatsApp primeiro! (Simulação: clique em Gerar QR Code)');
            return;
        }
        if (sentCount >= dailyLimit) {
            alert('Limite diário atingido (200 mensagens).');
            return;
        }
        if (csvData.length === 0) {
            alert('Carregue uma lista de contatos.');
            return;
        }

        setIsSending(true);
        sendingRef.current = true;
        processQueue();
    };

    const stopQueue = () => {
        setIsSending(false);
        sendingRef.current = false;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setNextSendTime(null);
        addLog('Disparos pausados pelo usuário.');
    };

    const processQueue = async () => {
        if (!sendingRef.current) return;

        // Check Limit
        const currentCount = parseInt(localStorage.getItem('wa_daily_count') || '0');
        if (currentCount >= dailyLimit) {
            stopQueue();
            addLog('Limite diário atingido. Parando fila.');
            return;
        }

        // Get next contact (Mock: taking random or sequential if we had a cursor. For demo, we just simulate sending to "Next")
        // Real implementation would track index. 
        // For visual demo, we just increment count.

        // Simulate Send
        addLog(`Enviando mensagem ${currentCount + 1}...`);

        // Random Delay (30s to 60s)
        const delay = Math.floor(Math.random() * (60000 - 30000 + 1) + 30000);
        // For DEMO purposes, reducing to 3-6 seconds to show functionality, user asked for 30-60s
        // const delay = Math.floor(Math.random() * (6000 - 3000 + 1) + 3000); 

        // USER REQUESTED 30-60s. I must respect safety.
        // But for video recording/demo, 30s is long. I will keep it real to specs.
        setNextSendTime(new Date(Date.now() + delay));

        timeoutRef.current = setTimeout(() => {
            if (!sendingRef.current) return;

            // Success Updates
            const newCount = currentCount + 1;
            setSentCount(newCount);
            localStorage.setItem('wa_daily_count', newCount.toString());
            addLog(`Mensagem enviada com sucesso! (${newCount}/${dailyLimit})`);

            // Loop
            processQueue();
        }, delay);
    };

    // -- RENDER HELPER --
    const insertTag = (tag) => {
        setMessageTemplate(prev => prev + ` {${tag}} `);
    };

    return (
        <div className="whatsapp-page page-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">WhatsApp Marketing</h1>
                    <p className="page-subtitle">Disparo em massa com segurança e spintax.</p>
                </div>
                <div className="limit-badge" style={{
                    background: sentCount >= 200 ? 'var(--danger)' : 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: sentCount >= 200 ? 'white' : 'var(--text-main)'
                }}>
                    <AlertTriangle size={16} />
                    <span style={{ fontWeight: 'bold' }}>Limite Diário: {sentCount} / {dailyLimit}</span>
                </div>
            </div>

            <div className="wa-grid">
                {/* LEFT COLUMN: CONNECTION & STATUS */}
                <div className="wa-col-left">
                    <div className="card connection-card">
                        <h3>Status do Dispositivo</h3>
                        <div className="status-indicator">
                            <div className={`status-dot ${connectionStatus}`}></div>
                            <span>{connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}</span>
                        </div>

                        {connectionStatus === 'disconnected' && (
                            <div className="connection-actions">
                                <div className="qr-placeholder">
                                    <QrCode size={64} style={{ opacity: 0.2 }} />
                                    <p>Aguardando solicitação</p>
                                </div>
                                <div className="btn-group">
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            setConnectionStatus('connecting');
                                            setTimeout(() => setConnectionStatus('connected'), 2000);
                                        }}
                                        style={{ width: '100%' }}
                                    >
                                        Gerar QR Code
                                    </button>
                                    <button className="btn-secondary" style={{ width: '100%' }} onClick={() => alert('Código: 123-456')}>
                                        Código de Pareamento
                                    </button>
                                </div>
                            </div>
                        )}

                        {connectionStatus === 'connected' && (
                            <div className="connected-info">
                                <Smartphone size={48} color="var(--success)" />
                                <p><strong>iPhone 13 Pro</strong></p>
                                <p className="text-muted">Bateria: 82%</p>
                                <button className="btn-secondary btn-sm" onClick={() => setConnectionStatus('disconnected')}>Desconectar</button>
                            </div>
                        )}
                    </div>

                    <div className="card logs-card" style={{ marginTop: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
                        <h3>Logs de Envio</h3>
                        <div className="terminal-window">
                            {logs.length === 0 && <span className="text-muted">Aguardando início...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="log-line">{log}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: CAMPAIGN MANAGER */}
                <div className="wa-col-right">
                    {/* STEP 1: IMPORT */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3>1. Lista de Contatos</h3>
                            <button onClick={loadLeadsMock} title="Recarregar Lista" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}>
                                <RefreshCw size={18} />
                            </button>
                        </div>
                        <div className="upload-area">
                            <input
                                type="file"
                                accept=".csv"
                                id="csvUpload"
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                            <label htmlFor="csvUpload" className="upload-label">
                                <Upload size={24} />
                                <span>{csvData.length > 0 ? `${csvData.length} contatos carregados` : 'Clique para carregar CSV'}</span>
                            </label>
                            {csvData.length > 0 && (
                                <div className="csv-stats">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Colunas detectadas: {Object.keys(csvData[0]).join(', ')}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* STEP 2: MESSAGE EDITOR */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <h3>2. Mensagem & Spintax</h3>

                        <div className="tags-bar">
                            <span className="text-muted" style={{ fontSize: '0.8rem', marginRight: '10px' }}>Inserir:</span>
                            <button className="tag-btn" onClick={() => insertTag('nome')}>Nome</button>
                            <button className="tag-btn" onClick={() => insertTag('telefone')}>Telefone</button>
                            <button className="tag-btn" onClick={() => setMessageTemplate(prev => prev + '{Olá;Oi;E aí} ')}>Spintax Saudação</button>
                        </div>

                        <textarea
                            className="wa-editor"
                            rows="5"
                            value={messageTemplate}
                            onChange={(e) => setMessageTemplate(e.target.value)}
                            placeholder="Digite sua mensagem aqui..."
                        ></textarea>

                        <div className="preview-box">
                            <strong>Prévia Renderizada:</strong>
                            <p>{previewMessage}</p>
                        </div>
                    </div>

                    {/* STEP 3: CONTROLS */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3>3. Controle de Disparo</h3>
                                {nextSendTime && isSending && (
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                                        Próximo envio em: {Math.ceil((nextSendTime - Date.now()) / 1000)}s
                                    </p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {isSending ? (
                                    <button className="btn-secondary" onClick={stopQueue} style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
                                        <Pause size={18} /> Pausar
                                    </button>
                                ) : (
                                    <button className="btn-primary" onClick={startQueue} disabled={sentCount >= dailyLimit}>
                                        <Play size={18} /> Iniciar Disparos
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .wa-grid {
                    display: grid;
                    grid-template-columns: 350px 1fr;
                    gap: 20px;
                }
                
                @media (max-width: 900px) {
                    .wa-grid { grid-template-columns: 1fr; }
                }

                .connection-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    min-height: 300px;
                }

                .status-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 15px 0;
                    padding: 4px 12px;
                    background: var(--bg-surface-hover);
                    border-radius: 20px;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                }
                .status-dot.disconnected { background: var(--danger); }
                .status-dot.connecting { background: var(--warning); animation: pulse 1s infinite; }
                .status-dot.connected { background: var(--success); }

                .qr-placeholder {
                    width: 150px;
                    height: 150px;
                    background: var(--bg-surface-hover);
                    margin: 20px auto;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                }

                .terminal-window {
                    background: #1e1e1e;
                    color: #00ff00;
                    font-family: 'Courier New', monospace;
                    padding: 10px;
                    border-radius: 4px;
                    flex: 1;
                    overflow-y: auto;
                    font-size: 0.8rem;
                    width: 100%;
                }

                .log-line {
                    margin-bottom: 4px;
                    border-bottom: 1px solid #333;
                }

                .upload-area {
                    border: 2px dashed var(--border);
                    padding: 30px;
                    text-align: center;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .upload-area:hover { border-color: var(--primary); background: var(--primary-light); }
                .upload-label { display: flex; flex-direction: column; alignItems: center; gap: 10px; cursor: pointer; }

                .tags-bar {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 10px;
                    flex-wrap: wrap;
                }

                .tag-btn {
                    padding: 4px 10px;
                    background: var(--bg-surface-hover);
                    border: 1px solid var(--border);
                    border-radius: 4px;
                    font-size: 0.8rem;
                    cursor: pointer;
                }
                .tag-btn:hover { border-color: var(--primary); color: var(--primary); }

                .wa-editor {
                    width: 100%;
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--bg-app);
                    color: var(--text-main);
                    resize: vertical;
                    font-family: inherit;
                }

                .preview-box {
                    margin-top: 15px;
                    padding: 15px;
                    background: #eefcf5;
                    border: 1px solid #6ee7b7;
                    border-radius: 8px;
                    color: #064e3b;
                }
                .light-mode .preview-box { background: #ecfdf5; border-color: #a7f3d0; }

                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default WhatsAppMarketing;
