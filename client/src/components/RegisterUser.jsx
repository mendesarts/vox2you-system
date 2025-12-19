import React, { useState, useEffect } from 'react';

const RegisterUser = ({ onClose, onSave, currentUser }) => {
    // 1. ESTADO INICIAL BLINDADO
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Senha inicial
        role: 'sales', // Padrão
        unit: '', // IMPORTANTE: Inicializar vazio
        phone: ''
    });

    const [error, setError] = useState('');

    // 2. PREENCHIMENTO AUTOMÁTICO (HERANÇA)
    useEffect(() => {
        // Se quem está criando NÃO é Master/Diretor, a unidade é travada na dele
        const isGlobalAdmin = ['master', 'director', 'diretor', 'franqueadora'].includes(currentUser.role);

        if (!isGlobalAdmin) {
            setFormData(prev => ({ ...prev, unit: currentUser.unit || currentUser.unitName || '' }));
        }
    }, [currentUser]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        // 3. VALIDAÇÃO RIGOROSA DA UNIDADE
        if (!formData.unit || formData.unit.trim() === '') {
            setError('O campo Unidade é obrigatório.');
            return;
        }

        const isGlobalAdmin = ['master', 'director', 'diretor', 'franqueadora'].includes(currentUser.role);
        // Validação de formato (apenas se for Master editando, senão confia na herança)
        if (isGlobalAdmin) {
            // Regex que aceita acentos: Brasília.Guará
            const unitRegex = /^[a-zA-ZÀ-ÿ0-9]+\.[a-zA-ZÀ-ÿ0-9\s-]+$/;
            if (!unitRegex.test(formData.unit)) {
                setError('Formato inválido. Use: Cidade.Bairro (Ex: Brasília.AsaSul)');
                return;
            }
        }

        // 4. PREPARAÇÃO DO PACOTE DE DADOS (Payload)
        const newUser = {
            // id: Date.now().toString(), // ID Único (Let parent/backend handle ID)
            name: formData.name,
            email: formData.email,
            password: formData.password || 'V@x2you!', // Senha padrão se vazia
            role: formData.role,

            // AQUI ESTÁ A CORREÇÃO: Força a unidade a ir junto
            unit: formData.unit,
            unitName: formData.unit,

            createdAt: new Date().toISOString(),
            avatar: null // Inicia sem foto
        };

        console.log("Salvando Novo Usuário com Unidade:", newUser); // Debug no Console

        // Chama a função do pai para salvar na lista
        onSave(newUser);
        // onClose(); // Let parent close after success? Or close here. Provided code says close here.
        // The parent might fail. Ideally parent closes. But prompt code showed onClose().
        // I will call onClose() in the parent after success, or here?
        // The provided snippet has onClose() at the end of handleSubmit.
        onClose();
    };

    const isGlobalAdmin = ['master', 'director', 'diretor', 'franqueadora'].includes(currentUser.role);

    // Styles (Inline for safety)
    const overlayStyle = {
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
    };
    const modalStyle = {
        backgroundColor: 'white', padding: '24px', borderRadius: '8px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '448px'
    };
    const inputStyle = {
        marginTop: '4px', display: 'block', width: '100%', borderRadius: '4px',
        border: '1px solid #d1d5db', padding: '8px', boxSizing: 'border-box'
    };
    const labelStyle = { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151' };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Novo Usuário</h2>

                {error && (
                    <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #fecaca' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Nome */}
                    <div>
                        <label style={labelStyle}>Nome Completo</label>
                        <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label style={labelStyle}>Email</label>
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    {/* Nível de Acesso (Antigo Cargo) */}
                    <div>
                        <label style={labelStyle}>Nível de Acesso</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{ ...inputStyle, backgroundColor: 'white' }}
                        >
                            <option value="sales">Consultor</option>
                            <option value="manager">Gestor</option>
                            <option value="financial">Financeiro</option>
                            {isGlobalAdmin && (
                                <>
                                    <option value="franqueado">Franqueado</option>
                                    <option value="director">Diretor</option>
                                    <option value="pedagogical_leader">Líder Pedagógico</option>
                                    <option value="pedagogical">Pedagógico</option>
                                </>
                            )}
                        </select>
                    </div>

                    {/* CAMPO UNIDADE (CRÍTICO) */}
                    <div>
                        <label style={labelStyle}>
                            Unidade <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400 }}>(Identificação da Franquia)</span>
                        </label>
                        <input
                            type="text"
                            name="unit"
                            required
                            // Se for admin, pode editar. Se não, só visualiza a herança.
                            readOnly={!isGlobalAdmin}
                            value={formData.unit}
                            onChange={handleChange}
                            placeholder="Ex: Brasília.LagoSul"
                            style={{
                                ...inputStyle,
                                backgroundColor: !isGlobalAdmin ? '#f3f4f6' : 'white',
                                color: !isGlobalAdmin ? '#6b7280' : 'inherit',
                                cursor: !isGlobalAdmin ? 'not-allowed' : 'text'
                            }}
                        />
                        {isGlobalAdmin && (
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>Padrão obrigatório: Cidade.Bairro</p>
                        )}
                    </div>

                    {/* Botões */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e5e7eb', marginTop: '8px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ padding: '8px 16px', fontSize: '0.875rem', color: '#374151', backgroundColor: 'transparent', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{ padding: '8px 16px', fontSize: '0.875rem', color: 'white', backgroundColor: '#4f46e5', border: 'none', borderRadius: '4px', fontWeight: 500, cursor: 'pointer' }}
                        >
                            Criar Usuário
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterUser;
