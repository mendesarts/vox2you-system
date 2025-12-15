import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import helpContent from '../data/helpContent';

const HelpButton = ({ context }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Get content based on context key
    const data = helpContent[context] || {
        title: 'Ajuda',
        content: '<p>Nenhuma dica disponível para esta tela.</p>'
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="help-fab"
                title="Dicas de Preenchimento"
                style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 9999,
                    transition: 'transform 0.2s',
                    ':hover': { transform: 'scale(1.1)' }
                }}
            >
                <HelpCircle size={24} />
            </button>

            {isOpen && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="help-modal animate-fade-in" style={{
                        backgroundColor: 'var(--bg-surface)',
                        padding: '30px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%',
                        position: 'relative',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)'
                    }}>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                position: 'absolute', top: '15px', right: '15px',
                                background: 'transparent', border: 'none',
                                color: 'var(--text-muted)', cursor: 'pointer'
                            }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <HelpCircle size={28} color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{data.title}</h2>
                        </div>

                        <div
                            className="help-content-body"
                            dangerouslySetInnerHTML={{ __html: data.content }}
                            style={{ lineHeight: '1.6', fontSize: '1rem', color: 'var(--text-secondary)' }}
                        />

                        <style>{`
                            .help-content-body ul { padding-left: 20px; margin: 15px 0; }
                            .help-content-body li { margin-bottom: 8px; }
                            .help-content-body strong { color: var(--text-primary); }
                        `}</style>

                        <div style={{ marginTop: '30px', textAlign: 'right' }}>
                            <button className="btn-primary" onClick={() => setIsOpen(false)}>Entendi</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpButton;
