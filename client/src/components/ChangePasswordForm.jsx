import React, { useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePasswordForm = () => {
    const { user } = useAuth();
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'As senhas novas não conferem.' });
            return;
        }

        if (passwords.new.length < 6) {
            setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
                setPasswords({ current: '', new: '', confirm: '' });
                // Optional: Force reload or logout if really strict
            } else {
                setMessage({ type: 'error', text: data.message || 'Erro ao alterar senha.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h4 style={{ color: 'var(--text-main)', marginBottom: '15px' }}>Alterar Senha</h4>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Senha Atual</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            required
                            className="input-field"
                            style={{ paddingLeft: '35px' }}
                            value={passwords.current}
                            onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Nova Senha</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            required
                            className="input-field"
                            style={{ paddingLeft: '35px' }}
                            value={passwords.new}
                            onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Confirmar Nova Senha</label>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            required
                            className="input-field"
                            style={{ paddingLeft: '35px' }}
                            value={passwords.confirm}
                            onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                        />
                    </div>
                </div>

                {message && (
                    <div style={{
                        padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '0.9rem',
                        background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                        color: message.type === 'error' ? '#ef4444' : '#16a34a',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                        {message.text}
                    </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                    {loading ? 'Salvando...' : 'Atualizar Senha'} <Save size={16} style={{ marginLeft: '8px' }} />
                </button>
            </form>
        </div>
    );
};

export default ChangePasswordForm;
