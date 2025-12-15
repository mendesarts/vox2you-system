import React, { useState, useEffect } from 'react';
import { Save, FileText, Plus, Trash2, Bot, BookOpen, User, LineChart } from 'lucide-react';

// Tabs Component for switching AI personas
const PersonasTabs = ({ activePersona, setPersona }) => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        <button
            onClick={() => setPersona('julia')}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activePersona === 'julia' ? '2px solid #8b5cf6' : '2px solid transparent',
                color: activePersona === 'julia' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: activePersona === 'julia' ? 600 : 400,
                cursor: 'pointer'
            }}
        >
            <User size={18} /> Julia (SDR)
        </button>
        <button
            onClick={() => setPersona('advisor')}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: activePersona === 'advisor' ? '2px solid #10b981' : '2px solid transparent',
                color: activePersona === 'advisor' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: activePersona === 'advisor' ? 600 : 400,
                cursor: 'pointer'
            }}
        >
            <LineChart size={18} /> Advisor Estratégico
        </button>
    </div>
);

const AITrainingSettings = () => {
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
            const res = await fetch('http://localhost:3000/api/ai-config');
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

    const handleSave = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/ai-config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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

    const handleRemoveManual = (index) => {
        const newManuals = [...manuals];
        newManuals.splice(index, 1);
        setManuals(newManuals);
    };

    if (loading) return <div>Carregando configurações...</div>;

    // Determine current text being edited
    const currentPrompt = activePersona === 'julia' ? juliaPrompt : advisorPrompt;
    const setCurrentPrompt = (val) => activePersona === 'julia' ? setJuliaPrompt(val) : setAdvisorPrompt(val);
    const themeColor = activePersona === 'julia' ? '#8b5cf6' : '#10b981';

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

        // Regex to match existing block (lazy match between markers)
        // We match literal markers, handling potential regex special chars in markers if any (none here really)
        const regex = new RegExp(`\\n\\n${startMarker}[\\s\\S]*?${endMarker}`, 'g');

        if (regex.test(currentText)) {
            // Replace existing block
            currentText = currentText.replace(regex, newBlock);
        } else {
            // Append new block if none exists
            // Also try to clean up any "old format" tone headers if they exist from previous edits
            currentText = currentText.replace(/\n\n\*\*TOM DE VOZ:[\s\S]*?(?=\n\n|$)/g, "");
            currentText = currentText.trim() + newBlock;
        }

        if (activePersona === 'julia') setJuliaPrompt(currentText);
        else setAdvisorPrompt(currentText);
    };

    return (
        <div className="animate-fade-in">
            <div className="manager-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <h3>Treinamento da Inteligência Artificial</h3>
                    <p className="page-subtitle">Configure o comportamento, tom de voz e base de conhecimento dos agentes.</p>
                </div>
                <button className="btn-primary" onClick={handleSave}>
                    <Save size={18} /> Salvar Alterações
                </button>
            </div>

            <PersonasTabs activePersona={activePersona} setPersona={setActivePersona} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left Column: System Prompt */}
                <div className="control-card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', width: '100%', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Bot size={20} color={themeColor} />
                            <h4 style={{ margin: 0 }}>Prompt ({activePersona === 'julia' ? 'SDR' : 'Advisor'})</h4>
                        </div>
                    </div>

                    {/* Tone Selectors */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Definir Personalidade:</span>
                        {activePersona === 'julia' ? (
                            <>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => applyTone('empathic')}>🥰 Empática</button>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => applyTone('energetic')}>🚀 Energética</button>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => applyTone('formal')}>👔 Formal</button>
                            </>
                        ) : (
                            <>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => applyTone('rigid')}>👮 Rígido</button>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => applyTone('optimistic')}>🚀 Otimista</button>
                                <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '4px 12px' }} onClick={() => applyTone('analytic')}>📊 Analítico</button>
                            </>
                        )}
                    </div>

                    <textarea
                        className="input-field"
                        style={{ width: '100%', minHeight: '500px', resize: 'vertical', fontFamily: 'monospace', lineHeight: '1.5' }}
                        value={currentPrompt}
                        onChange={(e) => setCurrentPrompt(e.target.value)}
                        placeholder="Selecione um tom acima ou escreva o prompt..."
                    />
                </div>

                {/* Right Column: Knowledge Base (Shared or Persona specific? Currently shared for simplicity) */}
                <div className="control-card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={20} color="#3b82f6" />
                            <h4 style={{ margin: 0 }}>Base de Conhecimento (Compartilhada)</h4>
                        </div>
                        <button className="btn-secondary" onClick={() => setShowNewManual(true)} disabled={showNewManual}>
                            <Plus size={16} /> Adicionar Manual
                        </button>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                        Adicione scripts, tabelas de preço e processos internos que ambos os agentes podem consultar.
                    </p>

                    {showNewManual && (
                        <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                            <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Novo Documento</h5>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem' }}>Título</label>
                                <input
                                    className="input-field"
                                    value={newManualTitle}
                                    onChange={(e) => setNewManualTitle(e.target.value)}
                                    placeholder="Ex: FAQ - Preços"
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.8rem' }}>Conteúdo</label>
                                <textarea
                                    className="input-field"
                                    style={{ width: '100%', minHeight: '100px' }}
                                    value={newManualContent}
                                    onChange={(e) => setNewManualContent(e.target.value)}
                                    placeholder="Cole aqui o texto do manual..."
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="btn-secondary" onClick={() => setShowNewManual(false)}>Cancelar</button>
                                <button className="btn-primary" onClick={handleAddManual}>Adicionar</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                        {manuals.length === 0 && !showNewManual && (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Nenhum manual cadastrado.
                            </div>
                        )}
                        {manuals.map((manual, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <FileText size={18} color="#64748b" />
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{manual.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {manual.content.substring(0, 40)}...
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveManual(index)}
                                    className="icon-btn"
                                    style={{ color: '#ef4444' }}
                                    title="Remover"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AITrainingSettings;
