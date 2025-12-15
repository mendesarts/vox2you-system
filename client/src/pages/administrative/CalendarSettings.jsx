import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Toast from '../../components/Toast';

const CalendarSettings = () => {
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '', type: 'holiday' });
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/calendar/holidays');
            const data = await res.json();
            setHolidays(data);
        } catch (error) {
            console.error('Erro ao carregar feriados:', error);
        }
    };

    const handleCreateHoliday = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3000/api/calendar/holidays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newHoliday)
            });
            if (res.ok) {
                loadHolidays();
                setNewHoliday({ name: '', startDate: '', endDate: '', type: 'holiday' });
                setToast({ message: 'Data salva com sucesso!', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao salvar data.', type: 'error' });
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('Tem certeza?')) return;
        try {
            const res = await fetch(`http://localhost:3000/api/calendar/holidays/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadHolidays();
                setToast({ message: 'Data removida.', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao remover data.', type: 'error' });
        }
    };

    return (
        <div className="calendar-settings">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div>
                    <h3 style={{ marginBottom: '15px' }}>Feriados e Recessos</h3>
                    <div className="holidays-list">
                        {holidays.map(h => (
                            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-app)', marginBottom: '8px', borderRadius: '6px', borderLeft: `4px solid ${h.type === 'holiday' ? '#ef4444' : '#f59e0b'}` }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{h.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {format(new Date(h.startDate), 'dd/MM/yyyy')}
                                        {h.startDate !== h.endDate && ` até ${format(new Date(h.endDate), 'dd/MM/yyyy')}`}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: h.type === 'holiday' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: h.type === 'holiday' ? '#ef4444' : '#f59e0b', padding: '2px 6px', borderRadius: '4px' }}>
                                        {h.type === 'holiday' ? 'Feriado' : 'Recesso'}
                                    </span>
                                    <button onClick={() => handleDeleteHoliday(h.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {holidays.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Nenhum feriado cadastrado.</p>}
                    </div>
                </div>

                <div className="add-holiday-form" style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: '8px', height: 'fit-content' }}>
                    <h4 style={{ marginBottom: '15px' }}>Adicionar Data</h4>
                    <form onSubmit={handleCreateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome do Evento</label>
                            <input
                                required
                                className="input-field"
                                value={newHoliday.name}
                                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                placeholder="Ex: Carnaval"
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Data Início</label>
                            <input
                                required
                                type="date"
                                className="input-field"
                                value={newHoliday.startDate}
                                onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value, endDate: e.target.value })} // Auto set end date same initially
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Data Fim (Opcional)</label>
                            <input
                                type="date"
                                className="input-field"
                                value={newHoliday.endDate}
                                onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tipo</label>
                            <select
                                value={newHoliday.type}
                                onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                            >
                                <option value="holiday">Feriado</option>
                                <option value="recess">Recesso</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                            <Plus size={16} /> Adicionar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CalendarSettings;
