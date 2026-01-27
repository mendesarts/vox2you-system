import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Check } from 'lucide-react';
import api from '../../services/api';

export default function ChatTab({ leadId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Polling simples para atualizar chat a cada 3s (Simulando tempo real)
    useEffect(() => {
        const fetchChat = async () => {
            try {
                const res = await api.get(`/leads/${leadId}/chat`);
                setMessages(res.data);
            } catch (err) {
                console.error("Error fetching chat:", err);
            }
        };
        if (leadId) fetchChat();
        const interval = setInterval(() => {
            if (leadId) fetchChat();
        }, 3000);
        return () => clearInterval(interval);
    }, [leadId]);

    const handleSend = async () => {
        if (!input.trim()) return;
        try {
            await api.post(`/leads/${leadId}/chat`, { content: input });
            setInput('');
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    return (
        <div className="chat-container" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
            {/* Área de Mensagens */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', background: '#e5ddd5', borderRadius: '8px 8px 0 0' }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        display: 'flex',
                        justifyContent: msg.direction === 'OUT' ? 'flex-end' : 'flex-start',
                        marginBottom: '10px'
                    }}>
                        <div style={{
                            maxWidth: '70%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: msg.direction === 'OUT' ? '#dcf8c6' : '#fff',
                            boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                            fontSize: '14px',
                            position: 'relative'
                        }}>
                            {msg.content}
                            <div style={{ fontSize: '10px', textAlign: 'right', color: '#999', marginTop: '4px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.direction === 'OUT' && (
                                    <span>
                                        {msg.status === 'PENDING_SEND' ? <Clock size={10} /> : <Check size={10} />}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
                        Nenhuma mensagem no histórico.
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Área de Input */}
            <div style={{ padding: '10px', background: '#f0f0f0', display: 'flex', gap: '10px', borderRadius: '0 0 8px 8px' }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Digite uma mensagem manual..."
                    style={{ flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' }}
                />
                <button onClick={handleSend} style={{ background: '#00a884', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
