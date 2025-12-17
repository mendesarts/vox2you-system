import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight } from 'lucide-react';
import '../index.css';

import logo from '../assets/logo-full-white.png';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [forceChangeMode, setForceChangeMode] = useState(false);
    const [tempUserId, setTempUserId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (forceChangeMode) {
            // Change Password Flow
            if (newPassword !== confirmPassword) {
                setError('As senhas não coincidem.');
                setLoading(false);
                return;
            }
            if (newPassword.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: tempUserId, newPassword })
                });

                if (res.ok) {
                    alert('Senha alterada com sucesso! Faça login novamente.');
                    setForceChangeMode(false);
                    setPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                } else {
                    const data = await res.json();
                    setError(data.error || 'Erro ao alterar senha.');
                }
            } catch (err) {
                setError('Erro de conexão.');
            } finally {
                setLoading(false);
            }

        } else {
            // Login Flow
            try {
                const userData = await login(email, password);

                if (userData?.user?.forcePasswordChange) {
                    setForceChangeMode(true);
                    setTempUserId(userData?.user?.id);
                    // Clear auth from context/storage because we want them to re-login or at least not be fully "in" yet?
                    // Actually login() sets the token. We can keep it or revoke it.
                    // For security, strict implementations might require a temp token.
                    // Here we will just intercept the navigation.
                    return;
                }

                navigate('/dashboard');
            } catch (err) {
                console.error(err);
                setError(err.message || 'Email ou senha incorretos.');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden'
            }}>
                {/* Logo Header Bar */}
                <div style={{
                    background: 'var(--primary)',
                    padding: '30px 20px',
                    textAlign: 'center',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img src={logo} alt="Vox2you" style={{ height: '50px', width: 'auto' }} />
                </div>

                {/* Content Section */}
                <div style={{ padding: '40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h2 style={{ color: 'var(--text-main)', marginBottom: '10px', fontSize: '1.5rem' }}>
                            {forceChangeMode ? 'Criar Nova Senha' : 'Bem-vindo ao Vox2you'}
                        </h2>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {forceChangeMode
                                ? 'Por segurança, você deve alterar sua senha no primeiro acesso.'
                                : 'Faça login para acessar o sistema.'
                            }
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '20px',
                            fontSize: '0.875rem',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {!forceChangeMode ? (
                            <>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.875rem' }}>Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 40px',
                                                background: 'var(--bg-app)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--text-main)',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.875rem' }}>Senha</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 40px',
                                                background: 'var(--bg-app)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--text-main)',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.875rem' }}>Nova Senha</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="password"
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 40px',
                                                background: 'var(--bg-app)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--text-main)',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Nova senha segura"
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '8px', fontSize: '0.875rem' }}>Confirmar Nova Senha</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                                        <input
                                            type="password"
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 10px 10px 40px',
                                                background: 'var(--bg-app)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--text-main)',
                                                fontSize: '1rem'
                                            }}
                                            placeholder="Repita a senha"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '12px',
                                fontSize: '1rem',
                                background: 'var(--primary)',
                                color: '#fff',
                                borderRadius: 'var(--radius-md)',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Processando...' : (
                                <>
                                    {forceChangeMode ? 'Alterar Senha' : 'Entrar'} <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
