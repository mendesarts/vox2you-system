import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Smartphone, RefreshCw, CheckCircle, Wifi, QrCode, MessageSquare } from 'lucide-react';
import DataCard from '../../components/DataCard';

const WhatsAppConnection = () => {
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
            // Translate status on the fly if needed, or rely on backend sending Portuguese
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
                        <Smartphone size={24} color="var(--ios-teal)" /> Conexão WhatsApp
                    </h3>
                    <p style={{ opacity: 0.5, marginTop: '4px' }}>Conecte o número da escola para que os Agentes de IA possam atender.</p>
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

                {/* Status Card */}
                <DataCard
                    title="Status da Conexão"
                    subtitle="Monitoramento em Tempo Real"
                    status={isConnected ? "Online" : "Offline"}
                    statusColor={isConnected ? "border-emerald-500" : "border-gray-300"}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', textAlign: 'center', gap: '16px' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: isConnected ? 'rgba(52, 199, 89, 0.1)' : 'rgba(142, 142, 147, 0.1)',
                            color: isConnected ? '#34C759' : '#8E8E93'
                        }}>
                            {isConnected ? <CheckCircle size={40} /> : <Wifi size={40} />}
                        </div>

                        <div>
                            <h4 style={{ fontSize: '20px', fontWeight: '900', color: '#1C1C1E', margin: 0 }}>{status}</h4>
                            <p style={{ color: '#8E8E93', fontSize: '14px', marginTop: '4px', maxWidth: '300px' }}>
                                {isConnected
                                    ? "O sistema está pronto para receber e enviar mensagens automaticamente."
                                    : "Escaneie o QR Code ou use o Código de Emparelhamento para conectar."}
                            </p>
                        </div>
                    </div>
                </DataCard>

                {/* Connection Methods */}
                {!isConnected && (
                    <DataCard
                        title="Nova Conexão"
                        subtitle="Escolha um método para conectar"
                        statusColor="border-teal-500"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Method 1: QR Code */}
                            {qrCode && !pairingCode && (
                                <div style={{ textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold', color: '#1C1C1E', marginBottom: '16px' }}>
                                        <QrCode size={16} /> Opção 1: Escanear QR Code
                                    </div>
                                    <div style={{ display: 'inline-block', padding: '8px', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                        <img src={qrCode} alt="QR Code WhatsApp" style={{ maxWidth: '180px', display: 'block' }} />
                                    </div>
                                </div>
                            )}

                            {/* Method 2: Pairing Code */}
                            <div>
                                <h5 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', margin: 0 }}>
                                    <MessageSquare size={16} /> Opção 2: Código de Emparelhamento
                                </h5>

                                {!pairingCode ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            style={{
                                                flex: 1, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '10px 16px',
                                                fontSize: '14px', fontWeight: '600', outline: 'none', background: 'rgba(0,0,0,0.02)'
                                            }}
                                            placeholder="Ex: 5511999998888"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={requestPairingCode}
                                            disabled={loadingCode}
                                            style={{ height: '42px', padding: '0 20px', borderRadius: '12px' }}
                                        >
                                            {loadingCode ? <RefreshCw className="animate-spin" size={18} /> : 'Gerar Código'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', background: 'rgba(88, 86, 214, 0.05)', border: '1px solid rgba(88, 86, 214, 0.1)', borderRadius: '16px', padding: '24px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#5856D6', margin: '0 0 8px 0' }}>Digite este código no seu celular:</p>
                                        <div style={{ fontSize: '32px', letterSpacing: '0.2em', fontFamily: 'monospace', fontWeight: '900', color: '#5856D6', marginBottom: '16px' }}>
                                            {pairingCode}
                                        </div>
                                        <button
                                            style={{
                                                background: 'none', border: 'none', fontSize: '12px', fontWeight: 'bold', color: '#5856D6',
                                                textDecoration: 'underline', cursor: 'pointer'
                                            }}
                                            onClick={() => setPairingCode(null)}
                                        >
                                            Tentar outro número
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DataCard>
                )}
            </div>
        </div>
    );
};

export default WhatsAppConnection;
