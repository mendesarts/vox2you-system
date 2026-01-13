import React from 'react';

const DataCard = ({ title, subtitle, status, statusColor, children, actions, onClick, variant, centerHeader }) => {
    const statusMap = {
        'active': 'Ativo',
        'paid': 'Pago',
        'online': 'Online',
        'connected': 'Conectado',
        'pending': 'Pendente',
        'overdue': 'Vencido',
        'holiday': 'Feriado',
        'recess': 'Recesso',
        'recibo': 'Recibo',
        'contract': 'Contrato',
        'inactive': 'Inativo'
    };

    const searchStatus = status?.toLowerCase() || '';
    const displayStatus = statusMap[searchStatus] || status;

    const isTeal = ['active', 'paid', 'ativo', 'online', 'concluido', 'conectado', 'connected', 'recibo', 'contract'].includes(searchStatus);
    const isRed = ['overdue', 'vencido', 'feriado', 'holiday', 'inactive', 'inativo'].includes(searchStatus);

    let badgeStyle = { background: 'rgba(255, 149, 0, 0.1)', color: '#FF9500', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' };
    if (isTeal) badgeStyle = { ...badgeStyle, background: 'rgba(52, 199, 89, 0.1)', color: '#34C759' };
    if (isRed) badgeStyle = { ...badgeStyle, background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30' };

    let cardStyle = { display: 'flex', flexDirection: 'column' };
    if (onClick) cardStyle.cursor = 'pointer';

    return (
        <div
            onClick={onClick}
            className={`vox-card ${variant ? `card-${variant}` : ''}`}
            style={cardStyle}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', textAlign: centerHeader ? 'center' : 'left' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-main)', margin: 0 }}>
                        {title}
                    </h3>
                    {subtitle && (
                        <p style={{ fontSize: '12px', opacity: 0.5, margin: '4px 0 0 0' }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                {status && (
                    <span style={badgeStyle}>
                        {displayStatus}
                    </span>
                )}
            </div>

            <div style={{ flex: 1 }}>
                {(!children && children !== 0) ? (
                    <div style={{ padding: '20px 0', textAlign: 'center', opacity: 0.5, fontSize: '12px', fontStyle: 'italic' }}>
                        Aguardando dados...
                    </div>
                ) : children}
            </div>

            {actions && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '0.5px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    {actions}
                </div>
            )}
        </div>
    );
};

export default DataCard;
