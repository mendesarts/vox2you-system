import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/* 
  VOX2YOU UI LIBRARY - PURE CSS & IOS 26 Aesthetics
  Optimized for reliability and visual excellence.
*/

export const VoxModal = ({ isOpen, onClose, title, children, footer, width = '600px' }) => {
    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: '20px'
        }}>
            <div style={{
                background: '#fff', borderRadius: '32px', width: '100%', maxWidth: width,
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden', border: '1px solid rgba(255,255,255,0.4)',
                animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
                            width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', transition: '0.2s'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={{
                        padding: '24px 32px', borderTop: '1px solid rgba(0,0,0,0.05)',
                        background: 'rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'flex-end',
                        gap: '12px'
                    }}>
                        {footer}
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes modalSlideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>,
        document.body
    );
};
