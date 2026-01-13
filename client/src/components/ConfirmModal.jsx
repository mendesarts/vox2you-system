import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDangerous = false }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="vox-modal-overlay">
            <div className="vox-modal-content" style={{ maxWidth: '400px' }}>
                <div className="vox-modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isDangerous && <AlertTriangle size={20} color="#f87171" />}
                        {title}
                    </h3>
                    <button onClick={onClose} className="vox-modal-close-btn">
                        <X size={20} />
                    </button>
                </div>
                <div className="vox-modal-body">
                    <p>{message}</p>
                </div>
                <div className="vox-modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={isDangerous ? "btn-danger" : "btn-primary"}
                        style={isDangerous ? { backgroundColor: '#ef4444', color: 'white', border: 'none' } : {}}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
