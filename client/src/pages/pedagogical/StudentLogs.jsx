import React, { useState, useEffect } from 'react';
import { VoxModal } from '../../components/VoxUI';
import { History, BookOpen, ArrowRightLeft, UserPlus, Zap, Building2 } from 'lucide-react';

const StudentLogs = ({ isOpen, onClose, studentId, studentName }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchLogs();
        }
    }, [isOpen, studentId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pedagogical/student/${studentId}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Logs data received:', data);
            if (Array.isArray(data)) {
                setLogs(data);
            } else {
                console.error('Logs data is not an array:', data);
                setLogs([]);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (action) => {
        switch (action) {
            case 'ATTENDANCE': return <BookOpen size={16} className="text-blue-500" />;
            case 'TRANSFER': return <ArrowRightLeft size={16} className="text-purple-500" />;
            case 'ENROLLMENT': return <UserPlus size={16} className="text-emerald-500" />;
            case 'AUTO_ATTENDANCE': return <Zap size={16} className="text-amber-500" />;
            case 'UNIT_TRANSFER': return <Building2 size={16} className="text-purple-600" />;
            default: return <History size={16} className="text-gray-400" />;
        }
    };

    const formatAction = (action) => {
        return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <VoxModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Histórico de Atividades: ${studentName}`}
            width="600px"
        >
            <div className="p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {loading ? (
                    <div className="flex justify-center p-8">Carregando histórico...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">Nenhuma atividade registrada para este aluno.</div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <div key={log.id} style={{ display: 'flex', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--bg-app)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {getIcon(log.action)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            {formatAction(log.action)}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.date || log.createdAt).toLocaleString('pt-BR')}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                        {log.description}
                                    </div>
                                    {log.details?.reason && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                                            Motivo: {log.details.reason}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </VoxModal>
    );
};

export default StudentLogs;
