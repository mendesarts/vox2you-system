import React from 'react';

const PageHeader = ({ title, subtitle, actionLabel, onAction, actionIcon: Icon }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 page-fade-in">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 font-heading">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-muted mt-1 font-serif text-sm italic">
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
