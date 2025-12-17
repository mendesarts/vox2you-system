import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import Toast from '../../components/Toast';

const FIXED_HOLIDAYS = [
    { day: 1, month: 0, name: 'Confraternização Universal' },
    { day: 21, month: 3, name: 'Tiradentes' },
    { day: 1, month: 4, name: 'Dia do Trabalho' },
    { day: 7, month: 8, name: 'Independência do Brasil' },
    { day: 12, month: 9, name: 'Nossa Sr.ª Aparecida' },
    { day: 2, month: 10, name: 'Finados' },
    { day: 15, month: 10, name: 'Proclamação da República' },
    { day: 25, month: 11, name: 'Natal' }
];

const CalendarSettings = () => {
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '', type: 'holiday' });
    const [toast, setToast] = useState(null);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/holidays`);
            const data = await res.json();
            setHolidays(data);
        } catch (error) {
            console.error('Erro ao carregar feriados:', error);
        }
    };

    const handleCreateHoliday = async (e) => {
        e.preventDefault();
        await saveHoliday(newHoliday);
        setNewHoliday({ name: '', startDate: '', endDate: '', type: 'holiday' });
    };

    const saveHoliday = async (holidayData) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/holidays`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(holidayData)
            });
            if (res.ok) {
                loadHolidays();
                setToast({ message: 'Salvo com sucesso!', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao salvar.', type: 'error' });
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('Tem certeza?')) return;
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/holidays/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                loadHolidays();
                setToast({ message: 'Removido.', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao remover.', type: 'error' });
        }
    };

    const importNationalHolidays = async () => {
        setImporting(true);
        const currentYear = new Date().getFullYear();
        const years = [currentYear, currentYear + 1];
        let count = 0;

        for (const year of years) {
            for (const h of FIXED_HOLIDAYS) {
                // Check if already exists (simple check by name and year)
                // Note: Real check should be more robust, but this prevents obvious dupes in UI list if we filtered
                // We will just try to add. Backend might duplicate if not handled, but for MVP it's "Add National Holidays"

                const date = new Date(year, h.month, h.day);
                const dateStr = date.toISOString().split('T')[0];

                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/calendar/holidays`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: h.name,
                        startDate: dateStr,
                        endDate: dateStr,
                        type: 'holiday'
                    })
                });
                count++;
            }
        }
        setImporting(false);
        setToast({ message: `${count} Feriados importados/verificados!`, type: 'success' });
        loadHolidays();
    };

    return (
        <div className="calendar-settings">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Gerenciar Feriados</h3>
                <button
                    onClick={importNationalHolidays}
                    disabled={importing}
                    className="btn-secondary"
                    style={{ gap: '8px' }}
                >
                    <Download size={18} />
                    {importing ? 'Importando...' : 'Importar Feriados Nacionais (2 Anos)'}
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
                <div>
                    <div className="holidays-list">
                        {holidays.map(h => (
                            <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-app)', marginBottom: '8px', borderRadius: '6px', borderLeft: `4px solid ${h.type === 'holiday' ? '#ef4444' : '#f59e0b'}` }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{h.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={14} />
                                        {format(new Date(h.startDate), 'dd/MM/yyyy')}
                                        {h.startDate !== h.endDate && ` até ${format(new Date(h.endDate), 'dd/MM/yyyy')}`}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', background: h.type === 'holiday' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: h.type === 'holiday' ? '#ef4444' : '#f59e0b', padding: '4px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                        {h.type === 'holiday' ? 'Feriado' : 'Recesso'}
                                    </span>
                                    <button onClick={() => handleDeleteHoliday(h.id)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Remover">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {holidays.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', border: '2px dashed var(--border)', borderRadius: '8px' }}>Nenhum feriado cadastrado.</div>}
                    </div>
                </div>

                <div className="add-holiday-form" style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: '8px', height: 'fit-content', border: '1px solid var(--border)' }}>
                    <h4 style={{ marginBottom: '15px' }}>Adicionar Manualmente</h4>
                    <form onSubmit={handleCreateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome do Evento</label>
                            <input
                                required
                                className="input-field"
                                value={newHoliday.name}
                                onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                                placeholder="Ex: Aniversário da Cidade"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Data Início</label>
                            <input
                                required
                                type="date"
                                className="input-field"
                                value={newHoliday.startDate}
                                onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value, endDate: e.target.value })} // Auto set end date same initially
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Data Fim (Opcional)</label>
                            <input
                                type="date"
                                className="input-field"
                                value={newHoliday.endDate}
                                onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tipo</label>
                            <select
                                value={newHoliday.type}
                                onChange={e => setNewHoliday({ ...newHoliday, type: e.target.value })}
                                className="input-field"
                                style={{ width: '100%' }}
                            >
                                <option value="holiday">Feriado</option>
                                <option value="recess">Recesso</option>
                            </select>
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
                            <Plus size={18} /> Adicionar
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CalendarSettings;
