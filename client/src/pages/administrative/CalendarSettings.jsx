import React, { useState, useEffect } from 'react';
import { Flag, RefreshCw, Download, Plus, Calendar as CalendarIcon, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import { VoxModal } from '../../components/VoxUI';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';

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
                ...holidaysData.map(h => ({ ...h, listType: 'holiday', isGlobal: !h.unitId })),
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
        !h.isGlobal && h.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ padding: '0 0 32px 0' }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header Master */}
            {/* Header Actions Only (Title moved to Global Bar) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={loadNationalHolidays}
                        disabled={loading}
                        className="btn-secondary"
                        style={{ height: '40px', padding: '0 20px', borderRadius: '14px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13px' }}
                    >
                        {loading ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                        <span>Importar Nacionais</span>
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary"
                        style={{ height: '40px', padding: '0 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} />
                        <span>Novo Evento</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar-ios" style={{ marginBottom: '24px', padding: '8px 16px', background: 'rgba(255,255,255,0.8)' }}>
                <Search size={16} color="#8E8E93" />
                <input
                    type="text"
                    style={{
                        background: 'transparent', border: 'none', outline: 'none', width: '100%',
                        fontSize: '14px', fontWeight: '600', color: '#1C1C1E', padding: '8px'
                    }}
                    placeholder="Buscar por nome do evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table Layout */}
            <div className="vox-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Evento</th>
                            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo</th>
                            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Período</th>
                            <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHolidays.length === 0 ? (
                            <tr>
                                <td colSpan="4" style={{ padding: '48px 24px', textAlign: 'center', color: '#8E8E93', fontSize: '14px', fontWeight: '500' }}>
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
                                let iconColor = '#8E8E93';

                                if (isHoliday) { badgeBg = 'rgba(255, 59, 48, 0.1)'; badgeColor = '#FF3B30'; iconColor = '#FF3B30'; }
                                if (isRecess) { badgeBg = 'rgba(255, 149, 0, 0.1)'; badgeColor = '#FF9500'; iconColor = '#FF9500'; }

                                return (
                                    <tr key={h.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', transition: 'background 0.2s' }} className="hover:bg-gray-50">
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '42px', height: '42px', borderRadius: '12px', display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    background: badgeBg,
                                                    color: iconColor,
                                                    border: `1px solid ${badgeBg.replace('0.1', '0.2')}`
                                                }}>
                                                    <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.8 }}>{format(start, 'MMM', { locale: ptBR })}</span>
                                                    <span style={{ fontSize: '16px', fontWeight: '900', lineHeight: 1 }}>{format(start, 'dd')}</span>
                                                </div>
                                                <div style={{ fontWeight: '700', color: '#1C1C1E', fontSize: '15px' }}>{h.name}</div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                            <span style={{
                                                padding: '6px 12px', borderRadius: '50px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                                                background: badgeBg, color: badgeColor
                                            }}>
                                                {isHoliday ? 'Feriado' : isRecess ? 'Recesso' : 'Bloqueio'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <div style={{ fontSize: '13px', color: '#1C1C1E', fontWeight: '600' }}>
                                                    {format(new Date(h.startDate), 'dd/MM/yyyy')}
                                                    {h.endDate && h.endDate !== h.startDate && (
                                                        <span style={{ color: '#8E8E93', margin: '0 6px', fontWeight: '400' }}>até</span>
                                                    )}
                                                    {h.endDate && h.endDate !== h.startDate && format(new Date(h.endDate), 'dd/MM/yyyy')}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#8E8E93', textTransform: 'capitalize', fontWeight: '500' }}>
                                                    {format(new Date(h.startDate), 'EEEE', { locale: ptBR })}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', verticalAlign: 'middle', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDeleteClick(h)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30',
                                                    border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Excluir"
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.2)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.1)'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                width="450px"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nome do Evento</label>
                        <input
                            className="input-field"
                            style={{ width: '100%', padding: '12px 16px', background: 'rgba(118, 118, 128, 0.12)', borderRadius: '10px', border: 'none', fontSize: '15px' }}
                            value={newHoliday.name}
                            onChange={e => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            placeholder="Ex: Carnaval, Feriado Municipal..."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Início</label>
                            <input
                                type="date"
                                style={{ width: '100%', padding: '12px 16px', background: 'rgba(118, 118, 128, 0.12)', borderRadius: '10px', border: 'none', fontSize: '15px' }}
                                value={newHoliday.startDate}
                                onChange={e => setNewHoliday({ ...newHoliday, startDate: e.target.value, endDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Término</label>
                            <input
                                type="date"
                                style={{ width: '100%', padding: '12px 16px', background: 'rgba(118, 118, 128, 0.12)', borderRadius: '10px', border: 'none', fontSize: '15px' }}
                                value={newHoliday.endDate}
                                onChange={e => setNewHoliday({ ...newHoliday, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tipo de Evento</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setNewHoliday({ ...newHoliday, type: 'holiday' })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                                    border: newHoliday.type === 'holiday' ? '2px solid #FF3B30' : '2px solid transparent',
                                    background: newHoliday.type === 'holiday' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(118, 118, 128, 0.12)',
                                    color: newHoliday.type === 'holiday' ? '#FF3B30' : '#8E8E93'
                                }}
                            >
                                Feriado
                            </button>
                            <button
                                onClick={() => setNewHoliday({ ...newHoliday, type: 'recess' })}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s',
                                    border: newHoliday.type === 'recess' ? '2px solid #FF9500' : '2px solid transparent',
                                    background: newHoliday.type === 'recess' ? 'rgba(255, 149, 0, 0.1)' : 'rgba(118, 118, 128, 0.12)',
                                    color: newHoliday.type === 'recess' ? '#FF9500' : '#8E8E93'
                                }}
                            >
                                Recesso
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button
                            onClick={() => setIsCreating(false)}
                            style={{
                                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#F2F2F7', color: '#000', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateHoliday}
                            style={{
                                flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: 'var(--ios-teal)', color: '#fff', fontWeight: '700', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(48, 176, 199, 0.3)'
                            }}
                        >
                            Salvar Evento
                        </button>
                    </div>
                </div>
            </VoxModal>

            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Evento"
                message="Tem certeza que deseja excluir este evento?"
                itemName={itemToDelete?.name}
                warningText="Esta ação não poderá ser desfeita."
                confirmText="Excluir"
                cancelText="Cancelar"
            />
        </div >
    );
};

export default CalendarSettings;
