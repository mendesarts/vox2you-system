import React from 'react';

const PageHeader = ({ title, subtitle, actionLabel, onAction, actionIcon: Icon }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 page-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-500 mt-1.5 text-sm font-medium">
                        {subtitle}
                    </p>
                )}
            </div>

            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="btn-vox-primary shadow-lg"
                >
                    {Icon && <Icon size={18} />}
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default PageHeader;
