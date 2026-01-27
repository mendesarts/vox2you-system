import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    return createPortal(
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">
                {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            </div>
            <span className="toast-message">{message}</span>
            <button onClick={onClose} className="toast-close">
                <X size={16} />
            </button>
        </div>,
        document.body
    );
};

export default Toast;
