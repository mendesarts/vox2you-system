import React from 'react';

const TestModal = (props) => {
    // Determine props based on usage
    const isOpen = props.isOpen !== undefined ? props.isOpen : true;
    const onClose = props.onClose || (() => console.log('Close clicked'));
    const title = props.title || 'TEST MODAL';

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(255, 0, 0, 0.5)', // Semi-transparent RED
            zIndex: 999999, // Very high
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                textAlign: 'center'
            }}>
                <h1 style={{ color: 'red', fontWeight: 'bold', fontSize: '24px', marginBottom: '20px' }}>
                    DEBUG: {title}
                </h1>
                <p style={{ marginBottom: '20px' }}>
                    Se você está vendo isso, o modal abriu corretamente.<br />
                    O problema está no conteúdo do componente original.
                </p>
                <div style={{ textAlign: 'left', background: '#f0f0f0', padding: '10px', marginBottom: '20px', fontSize: '12px' }}>
                    Props Check:<br />
                    isOpen: {String(isOpen)}<br />
                    user: {props.user ? props.user.name : 'N/A'}
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    FECHAR (CLOSE)
                </button>
            </div>
        </div>
    );
};

export default TestModal;
