import React, { useState } from 'react';
import { VoxModal } from '../../components/VoxUI';
import { ArrowRightLeft, Info } from 'lucide-react';

const TransferModal = ({ isOpen, onClose, student, classes, onTransfer }) => {
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [toClassId, setToClassId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTransfer = async () => {
        if (!toClassId) return alert('Selecione a turma de destino');
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentId: student.id,
                    toClassId,
                    reason
                })
            });

            if (res.ok) {
                onTransfer();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao realizar transferência');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title="Transferência de Turma"
            width="500px"
        >
            <div className="p-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px' }}>
                    <div style={{ backgroundColor: 'var(--accent-teal)', color: 'white', padding: '10px', borderRadius: '50%' }}>
                        <ArrowRightLeft size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{student?.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            De: {student?.Class?.name || 'N/A'}
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Curso de Destino</label>
                    <select
                        value={selectedCourseId}
                        onChange={e => { setSelectedCourseId(e.target.value); setToClassId(''); }}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="">Selecione o Curso</option>
                        {Array.from(new Set(classes.map(c => c.Course?.id))).map(cid => {
                            const course = classes.find(c => c.Course?.id === cid)?.Course;
                            return course ? <option key={cid} value={cid}>{course.name}</option> : null;
                        })}
                    </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Turma de Destino</label>
                    <select
                        value={toClassId}
                        onChange={e => setToClassId(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                        disabled={!selectedCourseId}
                    >
                        <option value="">{selectedCourseId ? 'Selecione a Turma' : 'Selecione um curso primeiro'}</option>
                        {classes
                            .filter(c => c.id !== student?.classId)
                            .filter(c => !selectedCourseId || String(c.Course?.id) === String(selectedCourseId))
                            .map(c => (
                                <option key={c.id} value={c.id}>{c.Course?.name} - {c.classNumber || '-'} - {c.name}</option>
                            ))}
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Motivo da Transferência</label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ex: Mudança de horário, preferência de professor..."
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '80px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
                    <Info size={18} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: '#1e40af', lineHeight: '1.4' }}>
                        <strong>Atenção:</strong> O histórico de aulas assistidas será mantido. Ao transferir, o sistema marcará automaticamente como "Presente" as aulas na nova turma que correspondem aos módulos que o aluno já assistiu.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button
                        className="btn-primary"
                        onClick={handleTransfer}
                        disabled={loading || !toClassId}
                    >
                        {loading ? 'Processando...' : 'Confirmar Transferência'}
                    </button>
                </div>
            </div>
        </VoxModal>
    );
};

export default TransferModal;
