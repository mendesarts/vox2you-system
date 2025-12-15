import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, MessageCircle, Phone, Calendar, Search, AlertCircle, Bot, User } from 'lucide-react';
import LeadDetailsModal from './components/LeadDetailsModal';

const CRMBoard = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);

    // New Lead Form
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'Instagram', campaign: '' });

    // Kanban Columns Configuration
    const columns = {
        'new': { id: 'new', title: 'Novos Lead', color: '#3b82f6', icon: Bot },
        'qualifying_ia': { id: 'qualifying_ia', title: 'Qualificação (IA)', color: '#8b5cf6', icon: Bot },
        'scheduled': { id: 'scheduled', title: 'Agendamento', color: '#f59e0b', icon: User },
        'no_show': { id: 'no_show', title: 'No-Show (IA Resgate)', color: '#ef4444', icon: Bot },
        'negotiation': { id: 'negotiation', title: 'Negociação', color: '#10b981', icon: User },
        'won': { id: 'won', title: 'Matriculados', color: '#059669', icon: User },
        'lost': { id: 'lost', title: 'Perdidos', color: '#6b7280', icon: Bot }
    };

    const columnOrder = ['new', 'qualifying_ia', 'scheduled', 'no_show', 'negotiation', 'won', 'lost'];

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/crm/leads');
            const data = await res.json();
            setLeads(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const updatedLeads = leads.map(lead => {
            if (lead.id.toString() === draggableId) {
                return { ...lead, status: destination.droppableId };
            }
            return lead;
        });

        setLeads(updatedLeads);

        // API Call
        try {
            await fetch(`http://localhost:3000/api/crm/leads/${draggableId}/move`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: destination.droppableId })
            });
        } catch (error) {
            console.error('Error moving lead', error);
            fetchLeads(); // Revert on error
        }
    };

    const handleCreateLead = async () => {
        if (!newLead.name || !newLead.phone) {
            alert('Por favor, preencha Nome e WhatsApp.');
            return;
        }
        try {
            const res = await fetch('http://localhost:3000/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newLead)
            });
            if (res.ok) {
                fetchLeads();
                setShowNewLeadModal(false);
                setNewLead({ name: '', phone: '', email: '', source: 'Instagram', campaign: '' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLogInteraction = async (id) => {
        try {
            await fetch(`http://localhost:3000/api/crm/leads/${id}/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'call_manual', content: 'Contato realizado via CRM Board' })
            });
            fetchLeads(); // Refresh to see status change
        } catch (error) {
            console.error(error);
        }
    };

    const getLeadsByStatus = (status) => leads.filter(l => l.status === status);

    return (
        <div className="crm-board page-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 className="page-title">CRM & SDR Inteligente</h2>
                    <p className="page-subtitle">Pipeline de vendas com automação por IA.</p>
                </div>
                <button className="btn-primary" onClick={() => setShowNewLeadModal(true)}>
                    <Plus size={18} /> Novo Lead
                </button>
            </div>

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '20px', flex: 1 }}>
                    {columnOrder.map(colId => {
                        const column = columns[colId];
                        const colLeads = getLeadsByStatus(colId);

                        return (
                            <Droppable droppableId={colId} key={colId}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        style={{
                                            minWidth: '280px',
                                            backgroundColor: `${column.color}15`, // Light stepped background
                                            borderRadius: '12px',
                                            padding: '16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderTop: `4px solid ${column.color}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: column.color, fontWeight: 700 }}>
                                            <column.icon size={18} />
                                            {column.title}
                                            <span style={{ marginLeft: 'auto', background: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b' }}>
                                                {colLeads.length}
                                            </span>
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {colLeads.map((lead, index) => (
                                                <Draggable key={lead.id} draggableId={lead.id.toString()} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            style={{
                                                                userSelect: 'none',
                                                                padding: '16px',
                                                                backgroundColor: 'white',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                                borderLeft: `4px solid ${column.color}`,
                                                                cursor: 'pointer',
                                                                ...provided.draggableProps.style
                                                            }}
                                                            onClick={() => setSelectedLead(lead)}
                                                        >
                                                            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>{lead.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <MessageCircle size={12} /> {lead.source}
                                                            </div>

                                                            {lead.lastContactAt && (
                                                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '8px' }}>
                                                                    Último contato: {new Date(lead.lastContactAt).toLocaleDateString()}
                                                                </div>
                                                            )}

                                                            {lead.handledBy === 'AI' && (
                                                                <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#8b5cf6', background: '#f3e8ff', padding: '4px', borderRadius: '4px', textAlign: 'center' }}>
                                                                    🤖 Em atendimento IA
                                                                </div>
                                                            )}

                                                            {/* Quick Action for Automation */}
                                                            {(lead.status === 'new' || lead.status === 'no_show') && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleLogInteraction(lead.id); }}
                                                                    style={{ marginTop: '8px', width: '100%', border: '1px solid #e2e8f0', background: 'transparent', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                                                                >
                                                                    📞 Marcar Contato Feito
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}
                </div>
            </DragDropContext>

            {/* New Lead Modal - Enhanced UI */}
            {showNewLeadModal && (
                <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
                    <div className="modal-content" style={{ maxWidth: '450px', padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div className="modal-header" style={{ background: 'linear-gradient(to right, #4f46e5, #8b5cf6)', padding: '20px 24px', color: 'white' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>Novo Lead</h3>
                                <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.875rem' }}>Adicione um potencial cliente ao CRM.</p>
                            </div>
                            <button onClick={() => setShowNewLeadModal(false)} style={{ color: 'white', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '4px' }}><X size={20} /></button>
                        </div>

                        <div style={{ padding: '24px' }}>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={16} /> Nome Completo <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    className="input-field"
                                    placeholder="Ex: João Silva"
                                    value={newLead.name}
                                    onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={16} /> WhatsApp <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        className="input-field"
                                        placeholder="(00) 00000-0000"
                                        value={newLead.phone}
                                        onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Search size={16} /> Origem
                                    </label>
                                    <select className="input-field" value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value })}>
                                        <option>Instagram</option>
                                        <option>Google</option>
                                        <option>Indicação</option>
                                        <option>Passante</option>
                                        <option>Evento</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <MessageCircle size={16} /> Email (Opcional)
                                </label>
                                <input
                                    className="input-field"
                                    type="email"
                                    placeholder="joao@email.com"
                                    value={newLead.email}
                                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} /> Campanha / Tags
                                </label>
                                <input
                                    className="input-field"
                                    placeholder="Ex: Black Friday, Promoção de Verão..."
                                    value={newLead.campaign}
                                    onChange={e => setNewLead({ ...newLead, campaign: e.target.value })}
                                />
                            </div>

                            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} onClick={handleCreateLead}>
                                    <Plus size={18} /> Cadastrar Lead
                                </button>
                                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowNewLeadModal(false)}>
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple Mock X for modal since I may not have imported it
const X = ({ size }) => <span style={{ fontSize: size, fontWeight: 'bold', cursor: 'pointer' }}>✕</span>;

export default CRMBoard;
