import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Smartphone, RefreshCw, CheckCircle, AlertCircle, Wifi } from 'lucide-react';

const WhatsAppConnection = () => {
    const [socket, setSocket] = useState(null);
    const [status, setStatus] = useState('Desconectado');
    const [qrCode, setQrCode] = useState(null);
    const [pairingCode, setPairingCode] = useState(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loadingCode, setLoadingCode] = useState(false);

    // Connect to Socket on mount
    useEffect(() => {
        // Use the same base URL as the API, stripped of '/api' if necessary, or just relative if proxy
        // Since API_URL might be http://localhost:3000/api, we need http://localhost:3000
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace('/api', '');

        const newSocket = io(baseUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket conectado');
        });

        newSocket.on('status', (data) => {
            setStatus(data);
            if (data === 'Conectado!') {
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
        // Format number if needed? Baileys usually expects raw connection params or sanitized string.
        // Assuming simple string emit as handled in backend
        socket.emit('request_pairing_code', phoneNumber);
    };

    return (
        <div className="animate-fade-in">
            <div className="manager-header" style={{ marginBottom: '24px' }}>
                <h3><Smartphone size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Conexão WhatsApp (Baileys)</h3>
                <p className="page-subtitle">Conecte o número da escola para que os Agentes de IA possam atender.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Status Card */}
                <div className="control-card">
                    <div className="card-header">
                        <h4>Status da Conexão</h4>
                    </div>
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{
                            fontSize: '1.2rem',
                            fontWeight: 600,
                            color: status.includes('Conectado') ? '#10b981' : '#f59e0b',
                            marginBottom: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}>
                            {status.includes('Conectado') ? <CheckCircle size={32} /> : <Wifi size={32} />}
                            {status}
                        </div>

                        {status.includes('Conectado') && (
                            <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '8px', color: '#065f46' }}>
                                O sistema está pronto para receber e enviar mensagens automaticamente.
                            </div>
                        )}
                    </div>
                </div>

                {/* Connection Methods */}
                {!status.includes('Conectado') && (
                    <div className="control-card">
                        <div className="card-header">
                            <h4>Nova Conexão</h4>
                        </div>

                        {/* Tabs or Switcher? Let's just list vertical */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                            {/* Method 1: QR Code */}
                            {qrCode && !pairingCode && (
                                <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '20px' }}>
                                    <p style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Opção 1: Escanear QR Code</p>
                                    <img src={qrCode} alt="QR Code WhatsApp" style={{ maxWidth: '200px', border: '5px solid white' }} />
                                </div>
                            )}

                            {/* Method 2: Pairing Code */}
                            <div>
                                <p style={{ marginBottom: '10px', color: 'var(--text-muted)' }}>Opção 2: Código de Emparelhamento (Mais Estável)</p>

                                {!pairingCode ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            className="input-field"
                                            placeholder="5511999998888"
                                            value={phoneNumber}
                                            onChange={e => setPhoneNumber(e.target.value)}
                                        />
                                        <button
                                            className="btn-primary"
                                            onClick={requestPairingCode}
                                            disabled={loadingCode}
                                        >
                                            {loadingCode ? <RefreshCw className="spin" size={18} /> : 'Gerar Código'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', background: '#eef2ff', padding: '20px', borderRadius: '12px' }}>
                                        <p style={{ fontSize: '0.9rem', color: '#4f46e5', marginBottom: '8px' }}>Digite este código no seu celular:</p>
                                        <div style={{ fontSize: '2rem', letterSpacing: '4px', fontWeight: '800', fontFamily: 'monospace', color: '#312e81' }}>
                                            {pairingCode}
                                        </div>
                                        <button
                                            className="btn-secondary"
                                            style={{ marginTop: '16px', fontSize: '0.8rem' }}
                                            onClick={() => setPairingCode(null)}
                                        >
                                            Tentar outro número
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WhatsAppConnection;
