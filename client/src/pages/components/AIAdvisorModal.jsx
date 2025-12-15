import React, { useState } from 'react';
import { Sparkles, X, ChevronRight, AlertTriangle, CheckCircle, TrendingUp, BrainCircuit } from 'lucide-react';

const AIAdvisorModal = ({ onClose }) => {
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState(null);

    React.useEffect(() => {
        // Simulate AI "Thinking" time for effect
        setTimeout(() => {
            fetchAnalysis();
        }, 1500);
    }, []);

    const fetchAnalysis = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/ai-advisor/analyze');
            const data = await res.json();
            setAnalysis(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={24} color="#10b981" />;
            case 'warning': return <AlertTriangle size={24} color="#f59e0b" />;
            case 'danger': return <AlertTriangle size={24} color="#ef4444" />;
            case 'primary': return <BrainCircuit size={24} color="#8b5cf6" />;
            default: return <TrendingUp size={24} color="#3b82f6" />;
        }
    };

    const getBorderColor = (type) => {
        switch (type) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'danger': return '#ef4444';
            case 'primary': return '#8b5cf6';
            default: return '#3b82f6';
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ maxWidth: '700px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                            <Sparkles size={24} color="#fbbf24" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Vox2You AI Advisor</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>Análise Inteligente de Negócios</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ color: 'white', opacity: 0.8 }}><X size={24} /></button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafc' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
                            <div className="ai-loader"></div>
                            <h4 style={{ marginTop: '20px', color: '#4b5563' }}>Analisando seus dados...</h4>
                            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Processando financeiro, pedagógico e operacional.</p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#334155' }}>Resumo Executivo</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div className="control-card" style={{ textAlign: 'center', padding: '16px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Margem de Lucro</span>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: analysis?.stats?.margin > 20 ? '#10b981' : '#f59e0b' }}>
                                            {analysis?.stats?.margin?.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="control-card" style={{ textAlign: 'center', padding: '16px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Frequência Média</span>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: analysis?.stats?.attendanceRate > 75 ? '#10b981' : '#f59e0b' }}>
                                            {analysis?.stats?.attendanceRate?.toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="control-card" style={{ textAlign: 'center', padding: '16px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Novos Alunos</span>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                                            +{analysis?.stats?.newStudents}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#334155' }}>Insights & Recomendações</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {analysis?.insights?.map((insight, index) => (
                                    <div key={index} className="control-card" style={{
                                        borderLeft: `5px solid ${getBorderColor(insight.type)}`,
                                        display: 'flex',
                                        gap: '16px',
                                        padding: '20px'
                                    }}>
                                        <div style={{ marginTop: '4px' }}>
                                            {getIcon(insight.type)}
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    fontWeight: 'bold',
                                                    color: getBorderColor(insight.type),
                                                    backgroundColor: `${getBorderColor(insight.type)}15`,
                                                    padding: '2px 8px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {insight.area}
                                                </span>
                                            </div>
                                            <h5 style={{ fontSize: '1rem', margin: '0 0 4px 0', fontWeight: 600 }}>{insight.title}</h5>
                                            <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: '1.5' }}>{insight.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '16px', display: 'flex', justifyContent: 'flex-end', backgroundColor: 'white' }}>
                    <button className="btn-primary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Entendido <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <style>{`
                .ai-loader {
                    width: 48px;
                    height: 48px;
                    border: 5px solid #e2e8f0;
                    border-bottom-color: #8b5cf6;
                    border-radius: 50%;
                    display: inline-block;
                    box-sizing: border-box;
                    animation: rotation 1s linear infinite;
                }

                @keyframes rotation {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default AIAdvisorModal;
