import React, { useState } from 'react';
import { Globe, Shield, Copy, Check, Info, Rocket, Zap, Mail, Phone, ExternalLink, Building } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MarketingIntegrations = () => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);

    // Constrói a URL do Webhook com a Unidade Logada para facilitar para o Franqueado
    const unitId = user?.unitId || 1;
    const webhookUrl = `${window.location.origin.replace('5173', '3000')}/api/integrations/leads/webhook?unitId=${unitId}`;
    const systemToken = 'vox-secret-2026';

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const styles = {
        container: { display: 'flex', flexDirection: 'column', gap: '24px' },
        card: { background: '#fff', padding: '32px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
        header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' },
        unitBadge: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F2F2F7',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '700',
            color: '#1C1C1E'
        },
        section: { background: '#F2F2F7', padding: '20px', borderRadius: '12px', border: '1px solid #E5E5EA', marginBottom: '16px' },
        label: { fontSize: '12px', fontWeight: '700', color: '#1C1C1E', textTransform: 'uppercase', marginBottom: '8px', display: 'block' },
        urlBox: { display: 'flex', gap: '8px', background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #E5E5EA', fontFamily: 'monospace', fontSize: '13px', overflowX: 'auto' },
        badge: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' },
        docGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '32px' },
        docItem: { borderLeft: '3px solid var(--ios-teal)', paddingLeft: '16px' }
    };

    return (
        <div style={styles.container} className="animate-ios-pop">
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#E5F3FF', color: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Zap size={20} />
                        </div>
                        <span style={{ ...styles.badge, background: '#D1FAE5', color: '#065F46' }}>Integração Ativa</span>
                    </div>

                    <div style={styles.unitBadge}>
                        <Building size={14} color="#8E8E93" />
                        ID Unidade: <span style={{ color: '#007AFF' }}>{unitId}</span>
                    </div>
                </div>

                <div style={styles.section}>
                    <label style={styles.label}>Link do seu Webhook (Personalizado para sua Unidade)</label>
                    <div style={styles.urlBox}>
                        <div style={{ flex: 1, color: '#007AFF' }}>{webhookUrl}</div>
                        <button onClick={() => handleCopy(webhookUrl)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8E8E93' }}>
                            {copied ? <Check size={16} color="#34C759" /> : <Copy size={16} />}
                        </button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#8E8E93', marginTop: '8px' }}>
                        <Info size={10} style={{ marginRight: '4px' }} />
                        Os leads enviados para esta URL cairão automaticamente na sua unidade (ID {unitId}).
                    </p>
                </div>

                <div style={styles.section}>
                    <label style={styles.label}>Chave de Integração (Token)</label>
                    <div style={styles.urlBox}>
                        <div style={{ flex: 1, color: '#FF9500' }}>{systemToken}</div>
                        <button onClick={() => handleCopy(systemToken)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#8E8E93' }}>
                            <Copy size={16} />
                        </button>
                    </div>
                    <p style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px' }}>Este token é obrigatório para autenticar o envio de dados.</p>
                </div>

                <div style={styles.docGrid}>
                    <div style={styles.docItem}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>🚀 Google Ads</h4>
                        <p style={{ fontSize: '13px', color: '#48484A', margin: 0 }}>
                            1. Nas <b>Extensões de Formulário</b>, cole a URL da sua unidade.<br />
                            2. Use o seu Token no campo <b>Chave do Google</b>.<br />
                            3. O sistema identificará automaticamente campanhas e GCLID.
                        </p>
                    </div>
                    <div style={styles.docItem}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📱 Meta / Facebook Ads</h4>
                        <p style={{ fontSize: '13px', color: '#48484A', margin: 0 }}>
                            1. Utilize esta URL no painel de Webhooks do Meta.<br />
                            2. Selecione o objeto <b>Leadgen</b>.<br />
                            3. Use o Token como <b>Verify Token</b>.
                        </p>
                    </div>
                    <div style={styles.docItem}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>📍 Configuração Local</h4>
                        <p style={{ fontSize: '13px', color: '#48484A', margin: 0 }}>
                            Esta página foi configurada para a sua unidade. Não é necessário alterar o parâmetro <code>unitId</code> na URL, ele já reflete o seu ID de franqueado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingIntegrations;
