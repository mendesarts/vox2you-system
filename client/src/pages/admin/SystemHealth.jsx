import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Activity, Server, Database, Globe, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const SystemHealth = () => {
    const { user } = useAuth();
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkHealth = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.checkSystemHealth();
            setHealthData(data);
        } catch (err) {
            setError(err.message || 'Falha ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
    }, []);

    // Access Control
    if (user && user.role !== 'master') {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                <AlertTriangle size={48} style={{ marginBottom: '1rem', color: '#ef4444' }} />
                <h2>Acesso Restrito</h2>
                <p>Esta área é exclusiva para usuários MASTER.</p>
            </div>
        );
    }

    const StatusBadge = ({ status }) => {
        if (status === 'online') {
            return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 'bold' }}><CheckCircle size={16} /> Online</span>;
        }
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontWeight: 'bold' }}><XCircle size={16} /> Offline</span>;
    };

    const ShortcutCard = ({ title, desc, url, icon: Icon, color }) => (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: '12px',
            backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)',
            textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s', gap: '1rem'
        }} className="hover:scale-105">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: `${color}20`, color: color }}>
                    <Icon size={24} />
                </div>
                <ExternalLink size={16} style={{ opacity: 0.5 }} />
            </div>
            <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>{desc}</p>
            </div>
        </a>
    );

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Activity color="#ec4899" /> Monitoramento Técnico
                    </h1>
                    <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Status em tempo real da infraestrutura VoxFlow</p>
                </div>
                <button onClick={checkHealth} disabled={loading} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem',
                    background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer',
                    opacity: loading ? 0.7 : 1
                }}>
                    <RefreshCw size={18} className={loading ? 'spin' : ''} />
                    {loading ? 'Verificando...' : 'Atualizar Status'}
                </button>
            </div>

            {error && (
                <div style={{ padding: '1rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #fecaca' }}>
                    <strong>Erro na verificação:</strong> {error}
                </div>
            )}

            {/* SECTION A: STATUS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {/* BACKEND */}
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Server size={20} /> API Backend</h3>
                        {healthData ? <StatusBadge status={healthData.server.status} /> : <span style={{ opacity: 0.5 }}>...</span>}
                    </div>
                    {healthData?.server && (
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            <p>Uptime: {(healthData.server.uptime / 60).toFixed(0)} min</p>
                            <p>Host: {healthData.server.hostname}</p>
                            <p>Plataforma: Cloud Run (Linux)</p>
                        </div>
                    )}
                </div>

                {/* DATABASE */}
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database size={20} /> Banco de Dados Neon</h3>
                        {healthData ? <StatusBadge status={healthData.database.status} /> : <span style={{ opacity: 0.5 }}>...</span>}
                    </div>
                    {healthData?.database && (
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            <p>Latência: {healthData.database.latency}ms</p>
                            <p>Provider: Neon Tech (PostgreSQL)</p>
                            {healthData.database.error && <p style={{ color: '#ef4444' }}>Erro: {healthData.database.error}</p>}
                        </div>
                    )}
                </div>

                {/* FRONTEND */}
                <div style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Globe size={20} /> Frontend Vercel</h3>
                        <StatusBadge status="online" />
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                        <p>Status: Acessível</p>
                        <p>Deployment: Vercel Production</p>
                        <p>Versão: Latest</p>
                    </div>
                </div>
            </div>

            {/* SECTION B: SHORTCUTS */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Atalhos de Infraestrutura</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <ShortcutCard
                    title="Google Cloud Run"
                    desc="Logs, Metricas e Deploy do Servidor"
                    url="https://console.cloud.google.com/run?project=vox2you-system-978034491078"
                    icon={Server}
                    color="#4285F4"
                />
                <ShortcutCard
                    title="Neon Database"
                    desc="Console SQL, Branches e Backups"
                    url="https://console.neon.tech/app/projects"
                    icon={Database}
                    color="#00E599"
                />
                <ShortcutCard
                    title="Vercel Dashboard"
                    desc="Deployments do Site e Configurações"
                    url="https://vercel.com/dashboard"
                    icon={Globe}
                    color="#000000" // Black/White dependent on theme, but hardcoded here is fine for brand
                />
                <ShortcutCard
                    title="GitHub Repository"
                    desc="Código Fonte e Versionamento"
                    url="https://github.com/mendesarts/vox2you-system" // Assuming based on user path
                    icon={ExternalLink} // Generic Git icon not imported, generic link is okay
                    color="#6e5494"
                />
            </div>

            {/* SECTION C: STATS */}
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Database Stats</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                        {healthData?.stats?.totalLeads || 0}
                    </div>
                    <div style={{ opacity: 0.7 }}>Total de Leads</div>
                </div>
                <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {healthData?.stats?.totalUsers || 0}
                    </div>
                    <div style={{ opacity: 0.7 }}>Usuários Cadastrados</div>
                </div>
                <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {healthData?.stats?.totalAttendancesLast30Days || 0}
                    </div>
                    <div style={{ opacity: 0.7 }}>Presenças (30 dias)</div>
                </div>
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .hover\\:scale-105:hover { transform: scale(1.02) !important; cursor: pointer; }
            `}</style>
        </div>
    );
};

export default SystemHealth;
