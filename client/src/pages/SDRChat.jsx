import React, { useState } from 'react';
import { Send, Bot, User, Settings, Save, AlertCircle } from 'lucide-react';
import './sdr-chat.css';

const SDRChat = () => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'lead', text: 'Olá, vi o anúncio no Instagram sobre o curso de oratória.' },
        { id: 2, sender: 'agent', text: 'Olá! Tudo bem? Aqui é a assistente virtual da Vox2you. Fico feliz com seu interesse! Para começarmos, qual seu nome e cidade?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const [prompt, setPrompt] = useState(`Você é um assistente SDR da Vox2you.
Seu objetivo é qualificar leads e agendar consultorias.
Tom: Profissional, empático e persuasivo.
Regras:
1. Sempre pergunte o nome e objetivo.
2. Tente agendar para os próximos 3 dias.
3. Se o lead não responder, use gatilhos de urgência.`);

    const handleSend = () => {
        if (!input.trim()) return;

        // Add User Message
        const userMsg = { id: Date.now(), sender: 'lead', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI Response
        setTimeout(() => {
            const responses = [
                "Ótimo! Temos uma metodologia focada em prática. Você busca melhorar sua oratória para fins profissionais?",
                "Entendi. Temos horários disponíveis amanhã às 14h ou 16h para uma consultoria gratuita. Qual prefere?",
                "Perfeito. Vou agendar sua consultoria. Pode me confirmar seu WhatsApp para envio do link?"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];

            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'agent', text: randomResponse }]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="sdr-page page-fade-in">
            <div className="chat-layout">
                <div className="config-panel">
                    <div className="panel-header">
                        <h3><Settings size={18} /> Configuração do Agente IA</h3>
                        <button className="btn-save"><Save size={16} /> Salvar</button>
                    </div>

                    <div className="form-group">
                        <label>Prompt do Sistema (System Message)</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="prompt-editor"
                        />
                    </div>

                    <div className="form-group">
                        <label>Documentos de Treinamento (RAG)</label>
                        <div className="upload-box">
                            <span>Arraste PDFs de tabela de preços ou metodologia aqui</span>
                        </div>
                    </div>

                    <div className="stats-mini">
                        <div className="stat-row">
                            <span className="label">Leads Atendidos (Hoje)</span>
                            <span className="value">42</span>
                        </div>
                        <div className="stat-row">
                            <span className="label">Taxa de Agendamento</span>
                            <span className="value success">18.5%</span>
                        </div>
                    </div>
                </div>

                <div className="simulator-panel">
                    <div className="whatsapp-header">
                        <div className="wa-profile">
                            <div className="wa-avatar"><Bot size={20} /></div>
                            <div className="wa-info">
                                <span className="wa-name">Vox2you Assistant</span>
                                <span className="wa-status">Online • Business Account</span>
                            </div>
                        </div>
                    </div>

                    <div className="messages-area">
                        {messages.map(msg => (
                            <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                                {msg.text}
                                <span className="msg-time">10:42</span>
                            </div>
                        ))}
                        {isTyping && <div className="typing-indicator">Digitando...</div>}
                    </div>

                    <div className="input-area">
                        <input
                            type="text"
                            placeholder="Digite como se fosse um lead..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button onClick={handleSend}><Send size={18} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SDRChat;
