import React, { useState, useEffect } from 'react';
import { Save, FileText, Plus, Trash2, Bot, BookOpen, User, LineChart, Sparkles, BrainCircuit, AlertTriangle, Download, Monitor } from 'lucide-react';
import { VoxModal } from '../../components/VoxUI';
import DataCard from '../../components/DataCard';
import { useAuth } from '../../context/AuthContext';

// Tabs Component for switching AI personas
const PersonasTabs = ({ activePersona, setPersona }) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #E5E5EA', paddingBottom: '8px' }}>
        <button
            onClick={() => setPersona('julia')}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px 12px 0 0',
                fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                background: activePersona === 'julia' ? 'rgba(88, 86, 214, 0.05)' : 'transparent',
                color: activePersona === 'julia' ? '#5856D6' : '#8E8E93',
                borderBottom: activePersona === 'julia' ? '2px solid #5856D6' : '2px solid transparent'
            }}
        >
            <User size={18} /> JulIA (SDR)
        </button>
        <button
            onClick={() => setPersona('advisor')}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '12px 12px 0 0',
                fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                background: activePersona === 'advisor' ? 'rgba(52, 199, 89, 0.05)' : 'transparent',
                color: activePersona === 'advisor' ? '#34C759' : '#8E8E93',
                borderBottom: activePersona === 'advisor' ? '2px solid #34C759' : '2px solid transparent'
            }}
        >
            <LineChart size={18} /> Advisor Estratégico
        </button>
    </div>
);

const AITrainingSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activePersona, setActivePersona] = useState('julia'); // 'julia' or 'advisor'

    // Config States
    const [juliaPrompt, setJuliaPrompt] = useState('');
    const [advisorPrompt, setAdvisorPrompt] = useState('');
    const [manuals, setManuals] = useState([]);

    // For new Manual
    const [showNewManual, setShowNewManual] = useState(false);
    const [newManualTitle, setNewManualTitle] = useState('');
    const [newManualContent, setNewManualContent] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ai-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setJuliaPrompt(data.systemPrompt || '');
            setAdvisorPrompt(data.advisorPrompt || '');
            setManuals(JSON.parse(data.knowledgeBase || '[]'));
        } catch (error) {
            console.error('Error fetching AI config:', error);
        } finally {
            setLoading(false);
        }
    };

    // Role check: Master (1), Director (10), and Franchisee (20)
    const canAccessAI = [1, 10, 20].includes(Number(user?.roleId));
    if (user && !canAccessAI) {
        return (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
                <AlertTriangle size={64} style={{ marginBottom: '1.5rem', color: '#ef4444', margin: '0 auto' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1C1C1E', marginBottom: '8px' }}>Acesso Restrito</h2>
                <p>A configuração técnica da IA é exclusiva para a Diretoria e Master.</p>
            </div>
        );
    }

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/ai-config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    systemPrompt: juliaPrompt,
                    advisorPrompt: advisorPrompt,
                    knowledgeBase: manuals
                })
            });
            if (res.ok) {
                alert('Configurações da IA salvas com sucesso!');
            } else {
                alert('Erro ao salvar configurações.');
            }
        } catch (error) {
            console.error('Error saving AI config:', error);
        }
    };

    const handleAddManual = () => {
        if (!newManualTitle || !newManualContent) return;
        setManuals([...manuals, { title: newManualTitle, content: newManualContent }]);
        setNewManualTitle('');
        setNewManualContent('');
        setShowNewManual(false);
    };

    // Delete Manual State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [manualToDeleteIndex, setManualToDeleteIndex] = useState(null);

    const handleRemoveClick = (index) => {
        setManualToDeleteIndex(index);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteManual = () => {
        if (manualToDeleteIndex === null) return;
        const newManuals = [...manuals];
        newManuals.splice(manualToDeleteIndex, 1);
        setManuals(newManuals);
        setIsDeleteModalOpen(false);
        setManualToDeleteIndex(null);
    };

    if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#8E8E93' }}>Carregando configurações...</div>;

    // Determine current text being edited
    const currentPrompt = activePersona === 'julia' ? juliaPrompt : advisorPrompt;
    const setCurrentPrompt = (val) => activePersona === 'julia' ? setJuliaPrompt(val) : setAdvisorPrompt(val);

    const applyTone = (toneKey) => {
        const tones = {
            julia: {
                empathic: `**TOM DE VOZ: Empático e Acolhedor**\n- Use emojis (😊, 👋). Seja uma ouvinte ativa.\n- Valide os sentimentos do lead (ex: "Entendo perfeitamente o seu medo...").`,
                energetic: `**TOM DE VOZ: Energético e Motivador**\n- Use emojis vibrantes (🚀, 🔥). Transmita entusiasmo!\n- Enfatize a transformação e o sucesso.`,
                formal: `**TOM DE VOZ: Formal e Executivo**\n- Seja direta e polida. Evite gírias e excesso de emojis.\n- Transmita seriedade e competência profissional.`
            },
            advisor: {
                rigid: `**TOM DE VOZ: Rígido e Crítico**\n- Seja brutalmente honesto. Não amacie os fatos.\n- Se houver prejuízo, cobre responsabilidade imediatamente.\n- Use frases curtas e diretas.`,
                optimistic: `**TOM DE VOZ: Otimista e Visionário**\n- Foque no "copo meio cheio". Destaque o potencial de crescimento.\n- Sugira soluções criativas para os problemas.`,
                analytic: `**TOM DE VOZ: Analítico e Frio**\n- Baseie-se apenas em números. Sem emoção.\n- Apresente os fatos como eles são: dados brutos e lógica.`
            }
        };

        const toneText = tones[activePersona][toneKey];
        if (!toneText) return;

        let currentText = activePersona === 'julia' ? juliaPrompt : advisorPrompt;

        // Define Markers
        const startMarker = "⬇️ --- TOM DE VOZ (AUTOMÁTICO) ---";
        const endMarker = "⬆️ --- FIM DO TOM ---";
        const newBlock = `\n\n${startMarker}\n${toneText}\n${endMarker}`;

        const regex = new RegExp(`\\n\\n${startMarker}[\\s\\S]*?${endMarker}`, 'g');

        if (regex.test(currentText)) {
            currentText = currentText.replace(regex, newBlock);
        } else {
            currentText = currentText.replace(/\n\n\*\*TOM DE VOZ:[\s\S]*?(?=\n\n|$)/g, "");
            currentText = currentText.trim() + newBlock;
        }

        if (activePersona === 'julia') setJuliaPrompt(currentText);
        else setAdvisorPrompt(currentText);
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h3 style={{ fontSize: '24px', fontWeight: '900', color: '#1C1C1E', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                        <BrainCircuit size={24} color="#5856D6" /> Treinamento da IA
                    </h3>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginTop: '4px' }}>Configure o comportamento, tom de voz e base de conhecimento dos agentes.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Save size={18} /> Salvar Alterações
                </button>
            </div>

            <PersonasTabs activePersona={activePersona} setPersona={setActivePersona} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {/* Left Column: System Prompt */}
                <DataCard
                    title={`Prompt do Sistema (${activePersona === 'julia' ? 'SDR' : 'Advisor'})`}
                    subtitle="Defina a personalidade e instruções base."
                    statusColor={activePersona === 'julia' ? 'border-indigo-300' : 'border-emerald-300'}
                >
                    <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Tone Selectors */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', padding: '12px', background: '#F9F9F9', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#8E8E93', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Sparkles size={12} /> Personalidade:
                            </span>
                            {activePersona === 'julia' ? (
                                <>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid rgba(88, 86, 214, 0.2)', color: '#5856D6', fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }} onClick={() => applyTone('empathic')}>🥰 Empática</button>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid rgba(88, 86, 214, 0.2)', color: '#5856D6', fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }} onClick={() => applyTone('energetic')}>🚀 Energética</button>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid rgba(88, 86, 214, 0.2)', color: '#5856D6', fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }} onClick={() => applyTone('formal')}>👔 Formal</button>
                                </>
                            ) : (
                                <>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid rgba(52, 199, 89, 0.2)', color: '#34C759', fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }} onClick={() => applyTone('rigid')}>👮 Rígido</button>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid rgba(52, 199, 89, 0.2)', color: '#34C759', fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }} onClick={() => applyTone('optimistic')}>🚀 Otimista</button>
                                    <button style={{ padding: '6px 12px', background: '#fff', border: '1px solid rgba(52, 199, 89, 0.2)', color: '#34C759', fontSize: '11px', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer' }} onClick={() => applyTone('analytic')}>📊 Analítico</button>
                                </>
                            )}
                        </div>

                        <textarea
                            style={{
                                width: '100%', minHeight: '500px', padding: '16px', borderRadius: '12px', border: '1px solid #E5E5EA',
                                fontFamily: 'monospace', fontSize: '13px', color: '#1C1C1E', resize: 'vertical', lineHeight: '1.6', outline: 'none'
                            }}
                            value={currentPrompt}
                            onChange={(e) => setCurrentPrompt(e.target.value)}
                            placeholder="Selecione um tom acima ou escreva o prompt..."
                        />
                    </div>
                </DataCard>

                {/* Right Column: Knowledge Base */}
                <DataCard
                    title="Base de Conhecimento"
                    subtitle="Documentos compartilhados para todos os agentes."
                    statusColor="border-blue-300"
                    actions={
                        <button
                            style={{ background: 'rgba(0, 122, 255, 0.1)', color: '#007AFF', padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setShowNewManual(true)}
                            title="Adicionar Manual"
                        >
                            <Plus size={18} />
                        </button>
                    }
                >
                    <div style={{ paddingTop: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '16px', background: 'rgba(0, 122, 255, 0.05)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(0, 122, 255, 0.1)' }}>
                            Adicione scripts, tabelas de preço e processos internos. Ambos os agentes usarão essas informações para responder dúvidas.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                            {manuals.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#8E8E93', border: '2px dashed #E5E5EA', borderRadius: '12px' }}>
                                    <BookOpen size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                    <p style={{ fontSize: '14px' }}>Nenhum manual cadastrado.</p>
                                </div>
                            )}
                            {manuals.map((manual, index) => (
                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px', background: '#fff', border: '1px solid #E5E5EA', borderRadius: '12px', transition: 'border-color 0.2s', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                                        <div style={{ marginTop: '2px', background: 'rgba(0, 122, 255, 0.1)', padding: '6px', borderRadius: '8px', color: '#007AFF', height: 'fit-content' }}>
                                            <FileText size={16} />
                                        </div>
                                        <div>
                                            <h5 style={{ fontWeight: 'bold', color: '#1C1C1E', fontSize: '14px', margin: 0 }}>{manual.title}</h5>
                                            <p style={{ fontSize: '12px', color: '#8E8E93', marginTop: '4px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {manual.content.substring(0, 100)}...
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveClick(index)}
                                        style={{
                                            padding: '6px', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30',
                                            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}
                                        title="Remover"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </DataCard>
            </div>

            {/* MODAL FOR NEW MANUAL */}
            <VoxModal
                isOpen={showNewManual}
                onClose={() => setShowNewManual(false)}
                title="Novo Manual / Documento"
                theme="ios"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="label-field">Título do Documento</label>
                        <input
                            className="input-field" style={{ width: '100%' }}
                            value={newManualTitle}
                            onChange={(e) => setNewManualTitle(e.target.value)}
                            placeholder="Ex: FAQ - Tabela de Preços 2025"
                        />
                    </div>
                    <div>
                        <label className="label-field">Conteúdo</label>
                        <textarea
                            className="input-field" style={{ width: '100%', minHeight: '200px', resize: 'vertical' }}
                            value={newManualContent}
                            onChange={(e) => setNewManualContent(e.target.value)}
                            placeholder="Cole aqui o texto completo, regras e informações que a IA deve memorizar..."
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setShowNewManual(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                        <button onClick={handleAddManual} className="btn-primary" style={{ flex: 1 }}>Adicionar Manual</button>
                    </div>
                </div>
            </VoxModal>

            {/* DELETE MANUAL MODAL */}
            <VoxModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Remover Manual"
                width="400px"
            >
                <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Trash2 color="#FF3B30" size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>Remover Manual?</h3>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                        O manual será removido da base de conhecimento da IA. <br />
                        <span style={{ color: '#FF3B30', fontSize: '12px', fontWeight: '900' }}>Esta ação não pode ser desfeita.</span>
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="btn-secondary"
                            style={{ width: '100px' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDeleteManual}
                            className="btn-primary"
                            style={{ width: '100px', background: '#FF3B30', borderColor: '#FF3B30' }}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </VoxModal>
        </div>
    );
};

export default AITrainingSettings;
