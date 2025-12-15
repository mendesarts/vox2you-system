import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import './Modal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isDangerous = false }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {isDangerous && <AlertTriangle size={20} color="#ef4444" />}
                        {title}
                    </h3>
                    <button onClick={onClose} className="modal-close-btn">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={isDangerous ? "btn-danger" : "btn-primary"}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
