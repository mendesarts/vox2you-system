import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Check } from 'lucide-react';
import api from '../../services/api';

export default function ChatTab({ leadId }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Auto-scroll only when messages increase
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [messages.length]);

    // Polling Otimizado
    useEffect(() => {
        let isMounted = true;

        const fetchChat = async () => {
            try {
                const res = await api.get(`/leads/${leadId}/chat`);
                const newData = Array.isArray(res.data) ? res.data : [];

                if (!isMounted) return;

                setMessages(prev => {
                    const safePrev = Array.isArray(prev) ? prev : [];
                    // Simple optimization: check length and last message ID to avoid unnecessary re-renders
                    if (safePrev.length === newData.length) {
                        const lastPrev = safePrev[safePrev.length - 1];
                        const lastNew = newData[newData.length - 1];
                        if (lastPrev?.id === lastNew?.id && lastPrev?.status === lastNew?.status) {
                            return safePrev; // No change, skip render
                        }
                    }
                    return newData;
                });
            } catch (err) {
                console.error("Error fetching chat:", err);
            }
        };

        if (leadId) fetchChat();

        const interval = setInterval(() => {
            if (leadId) fetchChat();
        }, 5000); // 5 seconds polling

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [leadId]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        setLoading(true);
        try {
            await api.post(`/leads/${leadId}/chat`, { content: input });
            setInput('');
            // Optional: force fetch
            const res = await api.get(`/leads/${leadId}/chat`);
            if (Array.isArray(res.data)) setMessages(res.data);
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
            {/* Área de Mensagens */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', background: '#e5ddd5', borderRadius: '8px 8px 0 0' }}>
                {messages.map(msg => (
                    <div key={msg.id || Math.random()} style={{
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
                                {(() => {
                                    try {
                                        const d = new Date(msg.createdAt);
                                        return isNaN(d.getTime()) ? '--:--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    } catch (e) { return '--:--' }
                                })()}
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
                <button
                    disabled={loading}
                    onClick={handleSend}
                    style={{
                        background: loading ? '#94a3b8' : '#00a884',
                        color: 'white', border: 'none', borderRadius: '50%',
                        width: '40px', height: '40px', cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
}
