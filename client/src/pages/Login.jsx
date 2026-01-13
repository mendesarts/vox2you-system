import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, ArrowRight, Mail, ShieldAlert } from 'lucide-react';
import logo from '../assets/voxflow-full-logo.png';

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
            if (newPassword !== confirmPassword) {
                setError('As senhas não coincidem.');
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
                    alert('Senha definida com sucesso!');
                    setForceChangeMode(false);
                } else {
                    const data = await res.json();
                    setError(data.error || 'Erro ao redefinir.');
                }
            } catch (err) { setError('Erro de comunicação.'); } finally { setLoading(false); }
        } else {
            try {
                const userData = await login(email, password);
                if (userData?.user?.forcePasswordChange) {
                    setForceChangeMode(true);
                    setTempUserId(userData?.user?.id);
                    return;
                }
                navigate('/dashboard');
            } catch (err) { setError('Email ou senha inválidos.'); } finally { setLoading(false); }
        }
    };

    return (
        <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>

            <div className="vox-card-glass animate-ios-pop" style={{ padding: '48px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>

                {/* Logo & Intro */}
                <div style={{ marginBottom: '40px' }}>
                    <img src={logo} alt="VoxFlow" style={{ width: '200px', height: 'auto', marginBottom: '24px' }} />
                    <h2 style={{ fontSize: '28px', fontWeight: '900', color: '#000', letterSpacing: '-1px', margin: 0 }}>
                        {forceChangeMode ? 'Privacidade' : 'Acesso Hub'}
                    </h2>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#8E8E93', marginTop: '6px' }}>
                        {forceChangeMode ? 'Defina sua nova senha mestra' : 'Cockpit Corporativo Vox2You'}
                    </p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF3B30', padding: '12px', borderRadius: '14px', fontSize: '13px', fontWeight: '800', marginBottom: '24px' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {!forceChangeMode ? (
                        <>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{ position: 'absolute', left: '16px', top: '16px', color: '#8E8E93' }} size={20} />
                                <input
                                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                    placeholder="Endereço de e-mail"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', width: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)' }}
                                />
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{ position: 'absolute', left: '16px', top: '16px', color: '#8E8E93' }} size={20} />
                                <input
                                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Senha de acesso"
                                    className="input-field"
                                    style={{ paddingLeft: '48px', width: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)' }}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <input
                                type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                placeholder="Nova Senha"
                                className="input-field"
                                style={{ width: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)' }}
                            />
                            <input
                                type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirmar Senha"
                                className="input-field"
                                style={{ width: '100%', background: 'rgba(255,255,255,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.4)' }}
                            />
                        </>
                    )}

                    <button
                        type="submit" disabled={loading}
                        className="btn-primary"
                        style={{ height: '56px', borderRadius: '18px', fontSize: '16px', fontWeight: '900', gap: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                    >
                        {loading ? 'Validando...' : (
                            <>
                                <span>{forceChangeMode ? 'Atualizar Senha' : 'Entrar no Sistema'}</span>
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '48px', opacity: 0.3, fontSize: '10px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                    VoxFlow Executive OS • Cloud Secure
                </div>
            </div>
        </div>
    );
};

export default Login;
