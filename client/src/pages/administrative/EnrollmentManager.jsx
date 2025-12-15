import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle } from 'lucide-react';
import { fetchStudents } from '../../services/api';

const EnrollmentManager = () => {
    const [students, setStudents] = useState([]);

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            const data = await fetchStudents();
            setStudents(data || []);
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
        }
    };

    return (
        <div>
            <div className="filters-bar" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-app)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', width: '300px' }}>
                    <Search size={18} />
                    <input type="text" placeholder="Buscar aluno..." style={{ background: 'none', border: 'none', color: 'var(--text-main)', width: '100%', outline: 'none' }} />
                </div>
            </div>

            <div className="table-container" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Nome</th>
                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Curso / Turma</th>
                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Contrato</th>
                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Financeiro</th>
                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id}>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>{student.name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{student.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                    <div>{student.course}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.classInfo}</div>
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: student.contractStatus === 'signed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: student.contractStatus === 'signed' ? 'var(--success)' : 'var(--warning)' }}>
                                        {student.contractStatus === 'signed' ? 'Assinado' : 'Pendente'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: student.paymentStatus === 'paid' ? 'var(--success)' : 'var(--danger)' }}></span>
                                        {student.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px', borderBottom: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button title="Gerar Contrato" style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}><FileText size={16} /></button>
                                        <button title="Confirmar Pagto" style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}><CheckCircle size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {students.length === 0 && <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum aluno matriculado ainda.</p>}
            </div>
        </div>
    );
};

export default EnrollmentManager;
