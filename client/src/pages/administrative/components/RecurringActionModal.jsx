import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';

const RecurringActionModal = ({ isOpen, onClose, onConfirm, actionType, record }) => {
    const [selectedOption, setSelectedOption] = React.useState('current');
    const [localRecord, setLocalRecord] = React.useState(null);

    React.useEffect(() => {
        console.log('🎭 RecurringActionModal render:', { isOpen, record: !!record, actionType });

        // Salvar uma cópia do record quando o modal abre
        if (isOpen && record && !localRecord) {
            console.log('💾 Salvando cópia local do record');
            setLocalRecord(record);
        }

        // Limpar quando fechar
        if (!isOpen && localRecord) {
            console.log('🗑️ Limpando cópia local do record');
            setLocalRecord(null);
        }
    }, [isOpen, record]);

    const recordToUse = localRecord || record;

    if (!isOpen || !recordToUse) {
        console.log('❌ RecurringActionModal: não renderizando (isOpen:', isOpen, 'recordToUse:', !!recordToUse, ')');
        return null;
    }

    console.log('✅ RecurringActionModal: renderizando modal');

    const isRecurring = recordToUse?.launchType === 'recorrente';
    const isInstallment = recordToUse?.installments > 1;
    const isSingleRecord = !isRecurring && !isInstallment;

    const handleConfirm = () => {
        console.log('✅ Confirmando com escopo:', isSingleRecord ? 'current' : selectedOption);
        onConfirm(isSingleRecord ? 'current' : selectedOption);
    };

    const getTitle = () => {
        if (actionType === 'delete') {
            return 'Confirmar Exclusão';
        }
        return 'Confirmar Edição';
    };

    const getMessage = () => {
        if (isSingleRecord) {
            return actionType === 'delete'
                ? 'Tem certeza que deseja excluir este lançamento?'
                : 'Tem certeza que deseja editar este lançamento?';
        }
        if (isRecurring) {
            return 'Este é um lançamento recorrente. Como deseja proceder?';
        }
        if (isInstallment) {
            return `Este lançamento possui ${recordToUse.installments} parcelas. Como deseja proceder?`;
        }
        return 'Como deseja proceder?';
    };

    const getActionColor = () => {
        return actionType === 'delete' ? '#dc2626' : '#7e22ce';
    };

    return createPortal(
        <div
            onClick={(e) => {
                // Prevenir fechamento ao clicar no overlay
                if (e.target === e.currentTarget) {
                    e.stopPropagation();
                }
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10001,
                padding: '20px',
                animation: 'fadeIn 0.2s ease-out'
            }}>
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#fff',
                    borderRadius: '32px',
                    width: '100%',
                    maxWidth: '540px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.4)',
                    animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}>
                {/* Header */}
                <div style={{
                    padding: '24px 32px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.01), transparent)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: `linear-gradient(135deg, ${getActionColor()}15, ${getActionColor()}25)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <AlertCircle size={20} color={getActionColor()} />
                        </div>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '900',
                            margin: 0,
                            color: '#1a1a1a'
                        }}>
                            {getTitle()}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(0,0,0,0.05)',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: '#666'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(0,0,0,0.1)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(0,0,0,0.05)'}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '32px' }}>
                    <p style={{
                        marginBottom: isSingleRecord ? '0' : '24px',
                        fontSize: '15px',
                        color: '#4b5563',
                        lineHeight: '1.6',
                        fontWeight: '500',
                        textAlign: isSingleRecord ? 'center' : 'left'
                    }}>
                        {getMessage()}
                    </p>

                    {/* Mostrar opções apenas se for recorrente ou parcelado */}
                    {!isSingleRecord && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Opção: Apenas esta parcela */}
                            <label
                                onClick={() => setSelectedOption('current')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '20px',
                                    border: '2px solid',
                                    borderColor: selectedOption === 'current' ? getActionColor() : '#e5e7eb',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedOption === 'current'
                                        ? `${getActionColor()}08`
                                        : 'white',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: selectedOption === 'current' ? 'scale(1.02)' : 'scale(1)',
                                    boxShadow: selectedOption === 'current'
                                        ? `0 8px 16px ${getActionColor()}20`
                                        : '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: `2px solid ${selectedOption === 'current' ? getActionColor() : '#d1d5db'}`,
                                    marginRight: '16px',
                                    marginTop: '2px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: selectedOption === 'current' ? getActionColor() : 'white',
                                    transition: 'all 0.2s'
                                }}>
                                    {selectedOption === 'current' && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'white'
                                        }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        marginBottom: '6px',
                                        color: '#1a1a1a'
                                    }}>
                                        {actionType === 'delete' ? 'Excluir apenas esta parcela' : 'Editar apenas esta parcela'}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        lineHeight: '1.5'
                                    }}>
                                        {isRecurring
                                            ? 'Apenas o lançamento do mês atual será afetado'
                                            : `Apenas a parcela ${recordToUse?.currentInstallment || 1}/${recordToUse?.installments || 1} será afetada`
                                        }
                                    </div>
                                </div>
                            </label>

                            {/* Opção: Todas as parcelas futuras */}
                            <label
                                onClick={() => setSelectedOption('all')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    padding: '20px',
                                    border: '2px solid',
                                    borderColor: selectedOption === 'all' ? getActionColor() : '#e5e7eb',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    backgroundColor: selectedOption === 'all'
                                        ? `${getActionColor()}08`
                                        : 'white',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: selectedOption === 'all' ? 'scale(1.02)' : 'scale(1)',
                                    boxShadow: selectedOption === 'all'
                                        ? `0 8px 16px ${getActionColor()}20`
                                        : '0 2px 4px rgba(0,0,0,0.05)'
                                }}
                            >
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: `2px solid ${selectedOption === 'all' ? getActionColor() : '#d1d5db'}`,
                                    marginRight: '16px',
                                    marginTop: '2px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: selectedOption === 'all' ? getActionColor() : 'white',
                                    transition: 'all 0.2s'
                                }}>
                                    {selectedOption === 'all' && (
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'white'
                                        }} />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        marginBottom: '6px',
                                        color: '#1a1a1a'
                                    }}>
                                        {actionType === 'delete' ? 'Excluir todas as parcelas futuras' : 'Editar todas as parcelas futuras'}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#6b7280',
                                        lineHeight: '1.5'
                                    }}>
                                        {isRecurring
                                            ? 'Todos os lançamentos futuros deste plano serão afetados'
                                            : 'Todas as parcelas futuras (incluindo esta) serão afetadas'
                                        }
                                    </div>
                                </div>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '24px 32px',
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    background: 'rgba(0,0,0,0.02)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: '1px solid #e5e7eb',
                            background: 'white',
                            color: '#374151',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#f9fafb';
                            e.target.style.borderColor = '#d1d5db';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.borderColor = '#e5e7eb';
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: getActionColor(),
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: `0 4px 12px ${getActionColor()}40`
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = `0 6px 16px ${getActionColor()}50`;
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = `0 4px 12px ${getActionColor()}40`;
                        }}
                    >
                        Confirmar
                    </button>
                </div>
            </div>

            <style>
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes modalSlideUp {
                        from { transform: translateY(30px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                `}
            </style>
        </div>,
        document.body
    );
};

export default RecurringActionModal;
