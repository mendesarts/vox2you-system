import React, { useState, useEffect } from 'react';
import { Flag, RefreshCw, Download, Plus, Calendar as CalendarIcon, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import { VoxModal } from '../../components/VoxUI';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    const { user } = useAuth();
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ name: '', startDate: '', endDate: '', type: 'holiday' });
    const [toast, setToast] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const holidaysRes = await fetch(`${API_URL}/calendar/holidays`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const holidaysData = holidaysRes.ok ? await holidaysRes.json() : [];

            // Fetch blocks via events, simple range for list
            const year = new Date().getFullYear();
            const start = new Date(year, 0, 1).toISOString();
            const end = new Date(year, 11, 31).toISOString();

            const eventsRes = await fetch(`${API_URL}/calendar/events?start=${start}&end=${end}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const eventsData = eventsRes.ok ? await eventsRes.json() : [];
            const blocksData = eventsData.filter(e => e.type === 'block');

            const combined = [
                ...holidaysData.map(h => ({ ...h, listType: 'holiday' })),
                ...blocksData.map(b => ({
                    id: b.id.replace('block_', ''),
                    name: b.title.replace('Bloqueio: ', ''),
                    startDate: b.start,
                    endDate: b.end,
                    type: 'block',
                    listType: 'block',
                    isOwner: b.data?.userId === user.id
                }))
            ];

            // Fix isOwner check: ensure we correctly identify ownership
            const finalCombined = combined.map(i => ({
                ...i,
                isOwner: i.listType === 'block' ? (i.isOwner || (eventsData.find(e => e.id === `block_${i.id}`)?.data?.userId === user.id)) : false
            }));

            setHolidays(finalCombined);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHoliday = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/calendar/holidays`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newHoliday)
            });
            if (res.ok) {
                loadData();
                setToast({ message: 'Salvo com sucesso!', type: 'success' });
                setIsCreating(false);
                setNewHoliday({ name: '', startDate: '', endDate: '', type: 'holiday' });
            } else {
                setToast({ message: 'Erro ao salvar.', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Erro de conexão.', type: 'error' });
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const item = itemToDelete;

        let endpoint = `/calendar/holidays/${item.id}`;
        if (item.listType === 'block') {
            // Basic permission check
            if (user.role !== 'master' && !item.isOwner) {
                alert("Você não tem permissão para excluir este bloqueio.");
                setDeleteModalOpen(false);
                return;
            }
            endpoint = `/calendar/blocks/${item.id}`;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadData();
                setToast({ message: 'Removido com sucesso.', type: 'success' });
            }
        } catch (error) {
            setToast({ message: 'Erro ao remover.', type: 'error' });
        } finally {
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    const loadNationalHolidays = async () => {
        if (!window.confirm('Deseja carregar os feriados nacionais para o ano atual?')) return;
        setLoading(true);
        const year = new Date().getFullYear();
        let count = 0;
        try {
            const token = localStorage.getItem('token');
            const currentRes = await fetch(`${API_URL}/calendar/holidays`, { headers: { 'Authorization': `Bearer ${token}` } });
            const current = currentRes.ok ? await currentRes.json() : [];

            for (const h of FIXED_HOLIDAYS) {
                const date = new Date(year, h.month, h.day);
                const dateStr = format(date, 'yyyy-MM-dd');
                const exists = current.some(e => e.startDate.startsWith(dateStr) && e.name === h.name);

                if (!exists) {
                    await fetch(`${API_URL}/calendar/holidays`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ name: h.name, startDate: dateStr, endDate: dateStr, type: 'holiday', isGlobal: true })
                    });
                    count++;
                }
            }
            loadData();
            setToast({ message: `${count} feriados importados!`, type: 'success' });
        } catch (e) {
            setToast({ message: 'Erro na importação.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Filter logic
    const [searchTerm, setSearchTerm] = useState('');
    const filteredHolidays = holidays.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '0 0 32px 0' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header matches UsersPage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#1C1C1E', margin: 0 }}>
                        Configuração de Calendário
                    </h1>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginTop: '4px' }}>
                        Gerencie feriados, recessos e bloqueios administrativos.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={loadNationalHolidays} disabled={loading} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
                        <span>Importar Nacionais</span>
                    </button>
                    <button onClick={() => setIsCreating(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={20} />
                        <span>Novo Evento</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '12px', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                        <Search size={16} color="#8E8E93" />
                    </div>
                    <input
                        type="text"
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px',
                            border: '1px solid #E5E5EA', background: '#F2F2F7', fontSize: '14px', outline: 'none', transition: 'all 0.2s',
                            color: '#1C1C1E'
                        }}
                        placeholder="Buscar eventos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Layout */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#F9F9F9', borderBottom: '1px solid #E5E5EA' }}>
                            <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Evento</th>
                            <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Tipo</th>
                            <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase' }}>Período</th>
                            <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHolidays.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '40px 24px', textAlign: 'center', color: '#8E8E93', fontSize: '14px' }}>
                                    Nenhum evento encontrado.
                                </td>
                            </tr>
                        ) : (
                            filteredHolidays.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map(h => {
                                const start = new Date(h.startDate);
                                const isHoliday = h.type === 'holiday';
                                const isRecess = h.type === 'recess';

                                let badgeBg = '#F2F2F7';
                                let badgeColor = '#8E8E93';

                                if (isHoliday) { badgeBg = 'rgba(255, 59, 48, 0.1)'; badgeColor = '#FF3B30'; }
                                if (isRecess) { badgeBg = 'rgba(255, 149, 0, 0.1)'; badgeColor = '#FF9500'; }

                                return (
                                    <tr key={h.id} style={{ borderBottom: '1px solid #E5E5EA', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '10px', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.05)',
                                                    background: isHoliday ? 'rgba(255, 59, 48, 0.05)' : isRecess ? 'rgba(255, 149, 0, 0.05)' : '#F2F2F7',
                                                    color: isHoliday ? '#FF3B30' : isRecess ? '#FF9500' : '#8E8E93'
                                                }}>
                                                    <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>{format(start, 'MMM', { locale: ptBR })}</span>
                                                    <span style={{ fontSize: '16px', fontWeight: '900', lineHeight: 1 }}>{format(start, 'dd')}</span>
                                                </div>
                                                <div style={{ fontWeight: '600', color: '#1C1C1E', fontSize: '14px' }}>{h.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                            <span style={{
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase',
                                                background: badgeBg, color: badgeColor
                                            }}>
                                                {isHoliday ? 'Feriado' : isRecess ? 'Recesso' : 'Bloqueio'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                            <div style={{ fontSize: '13px', color: '#1C1C1E', fontWeight: '500' }}>
                                                {format(new Date(h.startDate), 'dd/MM/yyyy')}
                                                {h.endDate && h.endDate !== h.startDate && (
                                                    <span style={{ color: '#8E8E93', margin: '0 4px' }}>à</span>
                                                )}
                                                {h.endDate && h.endDate !== h.startDate && format(new Date(h.endDate), 'dd/MM/yyyy')}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#8E8E93', textTransform: 'capitalize', marginTop: '2px' }}>
                                                {format(new Date(h.startDate), 'EEEE', { locale: ptBR })}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleDeleteClick(h)}
                                                    style={{
                                                        padding: '6px', borderRadius: '8px', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30',
                                                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <VoxModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                title="Novo Evento"
                theme="ios"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#8E8E93', marginBottom: '4px', textTransform: 'uppercase' }}>Nome do Evento</label>
                        <input className="input-field" style={{ width: '100%' }} value={newHoliday.name} onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })} placeholder="Ex: Carnaval" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#8E8E93', marginBottom: '4px', textTransform: 'uppercase' }}>Data de Início</label>
                            <input type="date" className="input-field" style={{ width: '100%' }} value={newHoliday.startDate} onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value, endDate: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '900', color: '#8E8E93', marginBottom: '4px', textTransform: 'uppercase' }}>Data de Término</label>
                            <input type="date" className="input-field" style={{ width: '100%' }} value={newHoliday.endDate} onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setNewHoliday({ ...newHoliday, type: 'holiday' })}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                border: newHoliday.type === 'holiday' ? '1px solid #FF3B30' : '1px solid #E5E5EA',
                                background: newHoliday.type === 'holiday' ? 'rgba(255, 59, 48, 0.1)' : 'transparent',
                                color: newHoliday.type === 'holiday' ? '#FF3B30' : '#8E8E93'
                            }}
                        >
                            Feriado
                        </button>
                        <button
                            onClick={() => setNewHoliday({ ...newHoliday, type: 'recess' })}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                                border: newHoliday.type === 'recess' ? '1px solid #FF9500' : '1px solid #E5E5EA',
                                background: newHoliday.type === 'recess' ? 'rgba(255, 149, 0, 0.1)' : 'transparent',
                                color: newHoliday.type === 'recess' ? '#FF9500' : '#8E8E93'
                            }}
                        >
                            Recesso
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <button onClick={() => setIsCreating(false)} className="btn-secondary" style={{ flex: 1 }}>Cancelar</button>
                        <button onClick={handleCreateHoliday} className="btn-primary" style={{ flex: 1 }}>Salvar</button>
                    </div>
                </div>
            </VoxModal>

            {/* Delete Modal */}
            <VoxModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Excluir Evento"
                width="400px"
            >
                <div style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(255, 59, 48, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <Trash2 color="#FF3B30" size={32} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#1C1C1E', marginBottom: '8px' }}>Confirmar Exclusão</h3>
                    <p style={{ color: '#8E8E93', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                        O evento <strong>{itemToDelete?.name}</strong> será excluído permanentemente.
                        <br /><span style={{ color: '#FF3B30', fontSize: '12px', fontWeight: '900' }}>Esta ação não pode ser desfeita.</span>
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button
                            onClick={() => setDeleteModalOpen(false)}
                            className="btn-secondary"
                            style={{ width: '100px' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="btn-primary"
                            style={{ width: '100px', background: '#FF3B30', borderColor: '#FF3B30' }}
                        >
                            Excluir
                        </button>
                    </div>
                </div>
            </VoxModal>
        </div>
    );
};

export default CalendarSettings;
