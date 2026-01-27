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

                {/* Separation Section - Installation */}
                <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px', color: '#1C1C1E' }}>
                        <Monitor size={22} className="text-blue-600" /> Central de Instalação (Workers)
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

                        {/* Windows Card */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB', borderLeft: '5px solid #0078D7', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Monitor size={20} color="#0078D7" /> Windows
                                </h4>
                                <span style={{ fontSize: '10px', background: '#DBEAFE', color: '#1E40AF', padding: '4px 8px', borderRadius: '12px', height: 'fit-content' }}>
                                    Desktop
                                </span>
                            </div>

                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px', lineHeight: '1.5' }}>
                                Ideal para computadores da recepção ou administrativos. Cria atalho automaticamente.
                            </p>

                            <a
                                href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/api/installers/download-setup-win`}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#0078D7', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: '600', textDecoration: 'none', transition: 'all 0.2s' }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Download size={18} /> Baixar Instalador (.BAT)
                            </a>

                            <div style={{ marginTop: '20px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #F3F4F6' }}>
                                <strong style={{ fontSize: '12px', color: '#374151', display: 'block', marginBottom: '6px' }}>Instruções Rápidas:</strong>
                                <ol style={{ fontSize: '12px', color: '#6B7280', paddingLeft: '16px', margin: 0, lineHeight: '1.6' }}>
                                    <li>Baixe e execute como <strong>Administrador</strong>.</li>
                                    <li>Aguarde a instalação.</li>
                                    <li>Abra o atalho <strong>"Conectar WhatsApp"</strong>.</li>
                                </ol>
                            </div>
                        </div>

                        {/* Linux Card */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB', borderLeft: '5px solid #E95420', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1F2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Terminal size={20} color="#E95420" /> Linux
                                </h4>
                                <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#92400E', padding: '4px 8px', borderRadius: '12px', height: 'fit-content' }}>
                                    Servidores / VPS
                                </span>
                            </div>

                            <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '20px', lineHeight: '1.5' }}>
                                Recomendado para o servidor principal. Instalação via terminal ou script.
                            </p>

                            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                                <a
                                    href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/api/installers/download-setup-linux`}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#E95420', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: '600', textDecoration: 'none' }}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Download size={18} /> Baixar Script Setup (.SH)
                                </a>
                            </div>

                            <div style={{ marginTop: '20px', background: '#2d2d2d', padding: '12px', borderRadius: '8px', color: '#10B981', fontFamily: 'monospace', fontSize: '11px', overflowX: 'auto' }}>
                                <span style={{ color: '#6B7280' }}># Ou instale via terminal:</span><br />
                                wget -O install.sh {(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/api/installers/download-setup-linux && bash install.sh
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Guide Download */}
                <div style={{ gridColumn: '1 / -1', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ background: '#DCFCE7', padding: '12px', borderRadius: '50%' }}>
                            <MessageSquare size={24} color="#15803D" />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#14532D' }}>Manual de Instalação (VoxBox)</h4>
                            <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>Baixe o guia oficial em PDF/MD com fotos e passo-a-passo detalhado.</p>
                        </div>
                    </div>
                    <a
                        href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace('/api', '')}/api/installers/download-guide`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', color: '#15803D', border: '1px solid #15803D', padding: '10px 24px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Download size={18} /> Baixar Guia
                    </a>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppSDR;
