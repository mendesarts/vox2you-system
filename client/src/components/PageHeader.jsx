import React from 'react';

// Shared Page Header Component
// Usage: <PageHeader title="Meus Alunos" actionLabel="Novo Aluno" onAction={() => openModal()} />
const PageHeader = ({ title, subtitle, actionLabel, onAction, actionIcon: Icon }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 page-fade-in">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 font-heading">
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
                    className="btn-primary shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                    {Icon && <Icon size={18} />}
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default PageHeader;
