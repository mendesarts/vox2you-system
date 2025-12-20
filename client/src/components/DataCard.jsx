import React from 'react';

const DataCard = ({ title, subtitle, status, statusColor, children, actions, onClick }) => {
    // Legacy Status Helper
    const getStatusColor = (s) => {
        if (!s) return 'border-transparent';
        if (s === 'active' || s === 'ativo' || s === 'paid') return 'border-status-teal'; // mapped in CSS
        if (s === 'pending' || s === 'pendente') return 'border-status-gold';
        return 'border-gray-200';
    };

    // Use CSS Variable Logic or Class Logic based on statusColor prop
    // If statusColor starts with 'border-', we use it as class (aliased in index.css).
    // If it is 'vox-gold', we use style.

    let borderClass = statusColor || getStatusColor(status?.toLowerCase());
    if (borderClass === 'vox-gold') borderClass = 'border-amber-500'; // Alias
    if (borderClass === 'vox-teal') borderClass = 'border-teal-500'; // Alias

    return (
        <div
            onClick={onClick}
            className={`vox-card ${borderClass} ${onClick ? 'cursor-pointer' : ''}`}
            style={statusColor === 'transparent' ? {} : {}}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 font-heading">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-muted mt-1 font-serif italic opacity-80">
                            {subtitle}
                        </p>
                    )}
                </div>
                {status && (
                    <span className={`vox-badge ${['active', 'paid', 'ativo'].includes(status) ? 'badge-teal' : 'badge-gold'}`}>
                        {status}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {children}
            </div>

            {actions && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default DataCard;
