import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', color: '#991b1b', margin: '20px' }}>
                    <h3>Algo deu errado nesta seção.</h3>
                    <p style={{ fontSize: '0.9rem' }}>{this.state.error?.toString()}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '10px', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
