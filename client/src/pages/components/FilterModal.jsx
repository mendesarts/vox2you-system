import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Calendar, Check, User, DollarSign, Tag, Filter, ChevronDown } from 'lucide-react';

const FilterModal = ({ isOpen, onClose, filters, setFilters, consultants, leads = [], units = [], user, globalRole = false }) => {

    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters);
        }
    }, [isOpen, filters]);

    // Extract unique tags and counts
    const uniqueTags = useMemo(() => {
        const counts = {};
        leads.forEach(l => {
            if (l.tags) {
                const tList = Array.isArray(l.tags) ? l.tags : (typeof l.tags === 'string' ? l.tags.split(',') : []);
                tList.forEach(t => {
                    const tag = t.trim();
                    if (tag) counts[tag] = (counts[tag] || 0) + 1;
                });
            }
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [leads]);

    const presets = [
        { id: 'active', label: 'Leads ativos' },
        { id: 'mine', label: 'Meus leads' },
        { id: 'won', label: 'Leads ganhos' },
        { id: 'lost', label: 'Leads perdidos' },
        { id: 'all', label: 'Todos os Leads' },
        { id: 'no_task', label: 'Leads sem Tarefas', color: '#f59e0b' },
        { id: 'overdue', label: 'Leads com Tarefas Atrasadas', color: '#ef4444' }
    ];

    const handlePresetClick = (preset) => {
        const newFilters = { ...localFilters };
        newFilters.status = 'all';
        newFilters.responsibleId = 'all';
        newFilters.specialFilter = null;

        switch (preset.id) {
            case 'active':
                newFilters.status = 'active';
                break;
            case 'mine':
                newFilters.responsibleId = user.id;
                break;
            case 'won':
                newFilters.status = 'won';
                break;
            case 'lost':
                newFilters.status = 'closed';
                break;
            case 'no_task':
                newFilters.specialFilter = 'no_task';
                break;
            case 'overdue':
                newFilters.specialFilter = 'overdue';
                break;
            case 'all':
            default:
                newFilters.status = 'all';
                break;
        }
        setLocalFilters(newFilters);
    };

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
    };

    const handleClear = () => {
        setLocalFilters({
            unitId: 'all',
            responsibleId: 'all',
            source: 'all',
            temperature: 'all',
            startDate: '',
            endDate: '',
            status: 'all',
            specialFilter: null,
            name: ''
        });
    };

    // Shared Styles
    const inputStyle = { width: '100%', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', background: 'transparent' };
    const labelStyle = { fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '4px' };
    const sectionStyle = { marginBottom: '16px' };

    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 99999, paddingTop: '50px'
        }}>
            <div style={{
                background: '#fff', borderRadius: '16px', display: 'flex', flexDirection: 'column',
                width: '1000px', height: '70vh', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#334155' }}>Filtro e Busca</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClose} style={{ padding: '8px 16px', border: 'none', background: '#f1f5f9', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', color: '#64748b', cursor: 'pointer' }}>Cancelar</button>
                        <button onClick={handleClear} style={{ padding: '8px 16px', border: 'none', background: '#fee2e2', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold', color: '#dc2626', cursor: 'pointer' }}>Limpar</button>
                        <button onClick={handleApply} className="btn-primary" style={{ fontSize: '14px', borderRadius: '6px', padding: '8px 24px' }}>Buscar</button>
                    </div>
                </div>

                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* LEFT: PRESETS */}
                    <div style={{ width: '220px', background: '#f8fafc', borderRight: '1px solid #eee', padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                        <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' }}>Filtros Rápidos</div>
                        {presets.map(p => (
                            <button
                                key={p.id}
                                onClick={() => handlePresetClick(p)}
                                style={{
                                    textAlign: 'left',
                                    padding: '10px 12px',
                                    fontSize: '13px',
                                    // Highlight if active logic (checking if filters match preset)
                                    background: (
                                        (p.id === 'all' && localFilters.status === 'all' && (!localFilters.responsibleId || localFilters.responsibleId === 'all') && !localFilters.specialFilter) ||
                                        (p.id === 'active' && localFilters.status === 'active') ||
                                        (p.id === 'mine' && Number(localFilters.responsibleId) === Number(user.id)) ||
                                        (p.id === 'won' && localFilters.status === 'won') ||
                                        (p.id === 'lost' && localFilters.status === 'closed') ||
                                        (p.id === 'no_task' && localFilters.specialFilter === 'no_task') ||
                                        (p.id === 'overdue' && localFilters.specialFilter === 'overdue')
                                    ) ? '#2563eb' : 'transparent', // Blue-600 for active
                                    boxShadow: (
                                        (p.id === 'all' && localFilters.status === 'all' && (!localFilters.responsibleId || localFilters.responsibleId === 'all') && !localFilters.specialFilter) ||
                                        (p.id === 'active' && localFilters.status === 'active') ||
                                        (p.id === 'mine' && Number(localFilters.responsibleId) === Number(user.id)) ||
                                        (p.id === 'won' && localFilters.status === 'won') ||
                                        (p.id === 'lost' && localFilters.status === 'closed') ||
                                        (p.id === 'no_task' && localFilters.specialFilter === 'no_task') ||
                                        (p.id === 'overdue' && localFilters.specialFilter === 'overdue')
                                    ) ? '0 2px 4px rgba(37, 99, 235, 0.2)' : 'none',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                                    color: (
                                        (p.id === 'all' && localFilters.status === 'all' && (!localFilters.responsibleId || localFilters.responsibleId === 'all') && !localFilters.specialFilter) ||
                                        (p.id === 'active' && localFilters.status === 'active') ||
                                        (p.id === 'mine' && Number(localFilters.responsibleId) === Number(user.id)) ||
                                        (p.id === 'won' && localFilters.status === 'won') ||
                                        (p.id === 'lost' && localFilters.status === 'closed') ||
                                        (p.id === 'no_task' && localFilters.specialFilter === 'no_task') ||
                                        (p.id === 'overdue' && localFilters.specialFilter === 'overdue')
                                    ) ? '#ffffff' : '#475569',
                                    transition: '0.2s',
                                    fontWeight: (
                                        (p.id === 'all' && localFilters.status === 'all' && (!localFilters.responsibleId || localFilters.responsibleId === 'all') && !localFilters.specialFilter) ||
                                        (p.id === 'active' && localFilters.status === 'active') ||
                                        (p.id === 'mine' && Number(localFilters.responsibleId) === Number(user.id)) ||
                                        (p.id === 'won' && localFilters.status === 'won') ||
                                        (p.id === 'lost' && localFilters.status === 'closed') ||
                                        (p.id === 'no_task' && localFilters.specialFilter === 'no_task') ||
                                        (p.id === 'overdue' && localFilters.specialFilter === 'overdue')
                                    ) ? '600' : '500'
                                }}
                                onMouseEnter={e => {
                                    const isActive = (
                                        (p.id === 'all' && localFilters.status === 'all' && (!localFilters.responsibleId || localFilters.responsibleId === 'all') && !localFilters.specialFilter) ||
                                        (p.id === 'active' && localFilters.status === 'active') ||
                                        (p.id === 'mine' && Number(localFilters.responsibleId) === Number(user.id)) ||
                                        (p.id === 'won' && localFilters.status === 'won') ||
                                        (p.id === 'lost' && localFilters.status === 'closed') ||
                                        (p.id === 'no_task' && localFilters.specialFilter === 'no_task') ||
                                        (p.id === 'overdue' && localFilters.specialFilter === 'overdue')
                                    );
                                    if (!isActive) e.currentTarget.style.background = '#f1f5f9';
                                }}
                                onMouseLeave={e => {
                                    const isActive = (
                                        (p.id === 'all' && localFilters.status === 'all' && (!localFilters.responsibleId || localFilters.responsibleId === 'all') && !localFilters.specialFilter) ||
                                        (p.id === 'active' && localFilters.status === 'active') ||
                                        (p.id === 'mine' && Number(localFilters.responsibleId) === Number(user.id)) ||
                                        (p.id === 'won' && localFilters.status === 'won') ||
                                        (p.id === 'lost' && localFilters.status === 'closed') ||
                                        (p.id === 'no_task' && localFilters.specialFilter === 'no_task') ||
                                        (p.id === 'overdue' && localFilters.specialFilter === 'overdue')
                                    );
                                    if (!isActive) e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color || '#cbd5e1' }}></div>
                                {p.label === 'Todas etapas' ? 'Todos os Leads' : p.label}
                            </button>
                        ))}
                    </div>

                    {/* CENTER: FIELDS */}
                    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#fff' }}>
                        <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>



                            <div style={sectionStyle}>
                                <label style={labelStyle}>Propriedades de Lead</label>
                                <input style={inputStyle} placeholder="Nome do lead" value={localFilters.name || ''} onChange={e => setLocalFilters({ ...localFilters, name: e.target.value })} />
                            </div>

                            <div style={sectionStyle}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={labelStyle}>Data Inicial</label>
                                        <input type="date" style={inputStyle} value={localFilters.startDate} onChange={e => setLocalFilters({ ...localFilters, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Data Final</label>
                                        <input type="date" style={inputStyle} value={localFilters.endDate} onChange={e => setLocalFilters({ ...localFilters, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Status / Etapas</label>
                                <select style={inputStyle} value={localFilters.status || 'all'} onChange={e => setLocalFilters({ ...localFilters, status: e.target.value })}>
                                    <option value="all">Todas as etapas</option>
                                    <option value="new">Novo Lead</option>
                                    <option value="connecting">Conectando</option>
                                    <option value="connected">Conexão</option>
                                    <option value="scheduled">Agendamento</option>
                                    <option value="no_show">Bolo</option>
                                    <option value="negotiation">Negociação</option>
                                    <option value="won">Matricular</option>
                                    <option value="closed">Encerrado</option>
                                </select>
                            </div>

                            <div style={sectionStyle}>
                                <label style={labelStyle}>Responsável</label>
                                <select style={inputStyle} value={localFilters.responsibleId} onChange={e => setLocalFilters({ ...localFilters, responsibleId: e.target.value })}>
                                    <option value="all">Qualquer Responsável</option>
                                    {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: TAGS */}
                    <div style={{ width: '280px', background: '#f8fafc', borderLeft: '1px solid #eee', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>TAGS</label>
                            <input style={{ ...inputStyle, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 12px' }} placeholder="Localizar tags..." />
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {uniqueTags.length > 0 ? uniqueTags.map(([tag, count]) => (
                                <div key={tag} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', fontSize: '13px', color: '#475569', cursor: 'pointer', borderRadius: '6px' }} onMouseEnter={e => e.currentTarget.style.background = '#fff'}>
                                    <span>{tag}</span>
                                    <span style={{ fontSize: '10px', fontWeight: 'bold', background: '#e2e8f0', padding: '2px 6px', borderRadius: '10px' }}>{count}</span>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>Nenhuma tag</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default FilterModal;
