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
            <div className="filter-bar-ios" style={{ marginBottom: '24px' }}>
                <div style={{ flex: 1, minWidth: '300px', maxWidth: '400px', position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        className="input-field"
                        style={{ paddingLeft: '40px', width: '100%' }}
                    />
                </div>
            </div>

            <div className="finance-table-container">
                <table className="finance-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Curso / Turma</th>
                            <th>Contrato</th>
                            <th>Financeiro</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(student => (
                            <tr key={student.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--ios-teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>{student.name.charAt(0)}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{student.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{student.course}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.classInfo}</div>
                                </td>
                                <td>
                                    <span className={`status-badge ${student.contractStatus === 'signed' ? 'paid' : 'pending'}`}>
                                        {student.contractStatus === 'signed' ? 'Assinado' : 'Pendente'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: student.paymentStatus === 'paid' ? 'var(--ios-green)' : 'var(--ios-red)' }}></span>
                                        {student.paymentStatus === 'paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-icon" title="Gerar Contrato" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '6px', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}><FileText size={16} /></button>
                                        <button className="btn-icon" title="Confirmar Pagto" style={{ background: 'var(--bg-app)', border: '1px solid var(--border)', padding: '6px', borderRadius: '8px', color: 'var(--ios-green)', cursor: 'pointer' }}><CheckCircle size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {students.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p>Nenhum aluno matriculado ainda.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnrollmentManager;
