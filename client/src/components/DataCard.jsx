import React from 'react';

const DataCard = ({ title, subtitle, status, statusColor, children, actions, onClick }) => {
    // Status Logic
    const getStatusColor = (s) => {
        if (!s) return 'border-gray-200';
        if (s === 'active' || s === 'ativo' || s === 'paid') return 'border-teal-500';
        if (s === 'pending' || s === 'pendente') return 'border-amber-500';
        if (s === 'error' || s === 'inactive' || s === 'inativo') return 'border-rose-500';
        return 'border-gray-200';
    };

    const borderColor = statusColor || getStatusColor(status?.toLowerCase());

    return (
        <div
            onClick={onClick}
            className={`
                bg-white dark:bg-slate-800 
                rounded-2xl p-6 
                shadow-sm hover:shadow-lg hover:-translate-y-1 
                transition-all duration-300 
                border-l-4 ${borderColor}
                border-t border-r border-b border-gray-100 dark:border-gray-700
                group relative
                ${onClick ? 'cursor-pointer' : ''}
            `}
        >
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white font-heading tracking-tight leading-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-sm text-muted mt-1 font-serif italic opacity-80">
                            {subtitle}
                        </p>
                    )}
                </div>
                {status && (
                    <span className={`
                        px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                        ${status === 'active' ? 'bg-teal-100 text-teal-800' :
                            status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'}
                    `}>
                        {status}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {children}
            </div>

            {actions && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {actions}
                </div>
            )}
        </div>
    );
};

export default DataCard;
