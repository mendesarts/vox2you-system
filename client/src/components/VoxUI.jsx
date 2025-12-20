import React from 'react';
import { X } from 'lucide-react';

/* 
  VOX2YOU UI LIBRARY
  Strict implementation of the Brandbook.
*/

export const VoxButton = ({ children, onClick, variant = 'primary', icon: Icon, className = '', ...props }) => {
    const baseClass = variant === 'primary' ? 'btn-vox-primary' : 'btn-vox-secondary';
    return (
        <button onClick={onClick} className={`${baseClass} ${className}`} {...props}>
            {Icon && <Icon size={18} />}
            {children}
        </button>
    );
};

export const VoxCard = ({ children, statusColor = 'transparent', className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`vox-card ${className}`}
            style={{ borderTopColor: statusColor !== 'transparent' ? `var(--${statusColor})` : 'transparent' }}
        >
            {children}
        </div>
    );
};

export const VoxBadge = ({ children, color = 'gold' }) => {
    return (
        <span className={`vox-badge badge-${color}`}>
            {children}
        </span>
    );
};

export const VoxModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="vox-modal-overlay">
            <div className="vox-modal-content">
                <div className="vox-modal-header">
                    <h3 className="text-xl font-bold m-0 text-vox-dark">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                        <X size={24} />
                    </button>
                </div>
                <div className="vox-modal-body custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};
