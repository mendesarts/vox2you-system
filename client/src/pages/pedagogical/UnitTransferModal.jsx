import React, { useState, useEffect } from 'react';
import { VoxModal } from '../../components/VoxUI';
import { Building2, Info, Search } from 'lucide-react';

const UnitTransferModal = ({ isOpen, onClose, onTransfer }) => {
    const [students, setStudents] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [destinationUnitId, setDestinationUnitId] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const [resStudents, resUnits] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/students`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/units`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (resStudents.ok) setStudents(await resStudents.json());
            if (resUnits.ok) setUnits(await resUnits.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleTransfer = async () => {
        if (!selectedStudentId || !destinationUnitId) return alert('Selecione o aluno e a unidade de destino');

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/transfer-unit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    studentId: selectedStudentId,
                    destinationUnitId,
                    reason
                })
            });

            if (res.ok) {
                onTransfer();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Erro ao realizar transferência de unidade');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cpf?.includes(searchTerm)
    );

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title="Transferência entre Unidades"
            width="550px"
        >
            <div className="p-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-app)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                    <div style={{ backgroundColor: '#8b5cf6', color: 'white', padding: '10px', borderRadius: '50%' }}>
                        <Building2 size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>Mudança de Unidade</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            O aluno será movido para uma nova sede.
                        </div>
                    </div>
                </div>

                {/* Student Selection with Search */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Buscar Aluno</label>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Nome ou CPF"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '10px 10px 10px 34px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                        />
                    </div>
                    <select
                        value={selectedStudentId}
                        onChange={e => setSelectedStudentId(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="">Selecione o Aluno...</option>
                        {filteredStudents.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.Unit?.name || 'Geral'})</option>
                        ))}
                    </select>
                </div>

                {/* Destination Unit */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Unidade de Destino</label>
                    <select
                        value={destinationUnitId}
                        onChange={e => setDestinationUnitId(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)' }}
                    >
                        <option value="">Selecione a Unidade...</option>
                        {units.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Motivo (Opcional)</label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ex: Mudança de cidade, transferência corporativa..."
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '60px', resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', marginBottom: '20px' }}>
                    <Info size={18} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: '#1e40af', lineHeight: '1.4' }}>
                        <strong>Aviso:</strong> Ao transferir de unidade, o aluno será removido da turma atual. Você precisará matriculá-lo em uma nova turma na unidade de destino após a conclusão.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn-secondary">Cancelar</button>
                    <button
                        className="btn-primary"
                        onClick={handleTransfer}
                        disabled={loading || !selectedStudentId || !destinationUnitId}
                    >
                        {loading ? 'Transferindo...' : 'Confirmar Transferência'}
                    </button>
                </div>
            </div>
        </VoxModal>
    );
};

export default UnitTransferModal;
