import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Smartphone, RefreshCw, CheckCircle, Wifi, QrCode, MessageSquare, Download, Monitor, Zap, Terminal } from 'lucide-react';
import DataCard from '../../components/DataCard';

const WhatsAppSDR = () => {
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState('Desconectado');
    const [qrCode, setQrCode] = useState(null);
    const [pairingCode, setPairingCode] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loadingCode, setLoadingCode] = useState(false);

    // Connect to Socket on mount
    useEffect(() => {
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '');

        const newSocket = io(baseUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket conectado');
        });

        newSocket.on('status', (data) => {
            setStatus(data);
            if (data === 'Conectado!' || data === 'Connected') {
                setQrCode(null);
                setPairingCode(null);
            }
        });

        newSocket.on('qr', (url) => {
            setQrCode(url);
            setStatus('Aguardando Leitura do QR Code');
        });

        newSocket.on('pairing_code_response', (code) => {
            setPairingCode(code);
            setLoadingCode(false);
            setStatus('Código Gerado! Insira no WhatsApp.');
        });

        newSocket.on('error', (msg) => {
            alert(msg);
            setLoadingCode(false);
        });

        return () => newSocket.close();
    }, []);

    const requestPairingCode = () => {
        if (!phoneNumber) return alert('Digite o número do celular!');
        setLoadingCode(true);
        socket.emit('request_pairing_code', phoneNumber);
    };

    const isConnected = status.toLowerCase().includes('conectado') || status.toLowerCase().includes('connected');

    return (
        <div className="animate-fade-in pb-8">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <Smartphone size={24} color="#34C759" /> WhatsApp & Servidor SDR
                    </h3>
                    <p style={{ opacity: 0.5, marginTop: '4px' }}>Conecte seu WhatsApp e configure o servidor dedicado para a IA Julia.</p>
                </div>
                <div style={{
                    padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: isConnected ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 149, 0, 0.1)',
                    color: isConnected ? '#34C759' : '#FF9500'
                }}>
                    {isConnected ? <CheckCircle size={16} /> : <Wifi size={16} />}
                    {isConnected ? 'Sistema Ativo' : 'Aguardando Conexão'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>

                {/* Status & Connection Card */}
                <DataCard
                    title="Conexão WhatsApp"
                    subtitle="QR Code ou Código de Emparelhamento"
                    status={isConnected ? "Online" : "Aguardando"}
                    statusColor={isConnected ? "border-emerald-500" : "border-amber-500"}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 16px 0' }}>{status}</h4>

                            {qrCode && !pairingCode && !isConnected && (
                                <div style={{ display: 'inline-block', padding: '12px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }}>
                                    <img src={qrCode} alt="QR Code" style={{ maxWidth: '160px', display: 'block' }} />
                                </div>
                            )}

                            {pairingCode && (
                                <div style={{ background: 'rgba(88, 86, 214, 0.05)', border: '1px solid rgba(88, 86, 214, 0.1)', borderRadius: '16px', padding: '20px' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#5856D6', margin: '0 0 8px 0' }}>Código de Emparelhamento:</p>
                                    <div style={{ fontSize: '28px', letterSpacing: '0.2em', fontFamily: 'monospace', fontWeight: '900', color: '#5856D6' }}>
                                        {pairingCode}
                                    </div>
                                </div>
                            )}

                            {isConnected && (
                                <div style={{ color: '#34C759', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle size={48} />
                                    <p style={{ fontSize: '14px', fontWeight: '700' }}>WhatsApp conectado com sucesso!</p>
                                </div>
                            )}
                        </div>

                        {!isConnected && (
                            <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Ou use o Celular (Número)</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        className="input-field"
                                        placeholder="Ex: 5511999998888"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        className="btn-primary"
                                        onClick={requestPairingCode}
                                        disabled={loadingCode}
                                        style={{ height: '44px', borderRadius: '12px' }}
                                    >
                                        {loadingCode ? <RefreshCw className="animate-spin" size={18} /> : 'Gerar Código'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </DataCard>

                {/* SDR Installation Card */}
                <DataCard
                    title="Instalação Local (SDR)"
                    subtitle="Transforme este computador no servidor da IA"
                    statusColor="border-indigo-500"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ fontSize: '14px', color: '#444', margin: 0 }}>
                            Para que a IA Julia responda seus leads, você precisa baixar e rodar o iniciador em um computador (servidor).
                        </p>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Botão Windows */}
                            <a
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/api/sdr/download-launcher`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0078D7', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '13px' }}
                            >
                                <Download size={16} /> Launcher .BAT (Win)
                            </a>

                            {/* Botão Linux */}
                            <a
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/api/sdr/download-launcher-linux`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#E95420', color: 'white', padding: '10px 16px', borderRadius: '12px', fontSize: '13px' }}
                            >
                                <Terminal size={16} /> Launcher .SH (Linux)
                            </a>

                            {/* Botão Peso Pena (NEW) */}
                            <a
                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/sdr/download-optimizer-linux`}
                                className="btn-primary"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', background: '#9C27B0', color: 'white', gap: '8px', padding: '10px 16px', borderRadius: '12px', fontSize: '13px' }} // Roxo
                                title="Remove LibreOffice e acelera o sistema"
                            >
                                <Zap size={16} /> Script Otimizador (Peso Pena)
                            </a>
                        </div>

                        {/* Instruções (NEW) */}
                        <div style={{ marginTop: '10px', padding: '15px', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: '12px' }}>
                            <strong style={{ display: 'block', marginBottom: '10px', color: '#F57F17', fontSize: '14px' }}>⚡ COMO PREPARAR O SERVIDOR LINUX:</strong>
                            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#5D4037', lineHeight: '1.6' }}>
                                <li>Baixe o <strong>Launcher .SH</strong> (Laranja) e o <strong>Otimizador</strong> (Roxo).</li>
                                <li>Abra a pasta Downloads, clique com botão direito no espaço vazio e escolha <em>"Abrir no Terminal"</em>.</li>
                                <li>
                                    Para limpar e acelerar a máquina, digite: <br />
                                    <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>sudo bash Otimizar_SDR.sh</code>
                                </li>
                                <li>
                                    Para iniciar o robô, digite: <br />
                                    <code style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>bash VoxFlow_Linux.sh</code>
                                </li>
                            </ol>
                        </div>
                    </div>
                </DataCard>
            </div>
        </div>
    );
};

export default WhatsAppSDR;
