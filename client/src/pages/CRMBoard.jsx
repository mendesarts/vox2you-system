import React, { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Plus, MessageCircle, Phone, Calendar, Search, AlertCircle, Bot, User, FileSpreadsheet, Upload, X, Download, FileText } from 'lucide-react';
import LeadDetailsModal from './components/LeadDetailsModal';
import { useAuth } from '../context/AuthContext';

const CRMBoard = () => {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const fileInputRef = useRef(null);

    // New Lead Form
    const [newLead, setNewLead] = useState({ name: '', phone: '', email: '', source: 'Instagram', campaign: '' });

    // Kanban Columns Configuration
    // Kanban Columns Configuration
    const columns = {
        'new': { id: 'new', title: 'Novo Lead', color: '#3b82f6', icon: Bot },
        'connecting': { id: 'connecting', title: 'Conectando', color: '#8b5cf6', icon: MessageCircle },
        'connected': { id: 'connected', title: 'Conexão', color: '#6366f1', icon: User },
        'scheduled': { id: 'scheduled', title: 'Agendamento', color: '#f59e0b', icon: User },
        'no_show': { id: 'no_show', title: 'No-Show (IA Resgate)', color: '#ef4444', icon: Bot },
        'negotiation': { id: 'negotiation', title: 'Negociação', color: '#10b981', icon: User },
        'won': { id: 'won', title: 'Matriculados', color: '#059669', icon: User },
        'closed': { id: 'closed', title: 'Atendimento Encerrado', color: '#6b7280', icon: AlertCircle }
    };

    const columnOrder = ['new', 'connecting', 'connected', 'scheduled', 'no_show', 'negotiation', 'won', 'closed'];

    const getLeadsByStatus = (status) => {
        return leads.filter(lead => lead.status === status);
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setLeads(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Move Stage Modal State
    const [moveModal, setMoveModal] = useState({ isOpen: false, leadId: null, destinationId: null, sourceId: null, data: {} });
    const [moveData, setMoveData] = useState({ notes: '', proposedValue: '' });

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        // Check for transition requirements
        const destId = destination.droppableId;

        // 1. Connection: Requires Input (Result)
        // 2. Scheduled: Requires Appointment Date
        // 3. Negotiation: Requires Input (Notes + Value)
        // 4. Closed: Requires Input (Reason)
        if (['connected', 'scheduled', 'negotiation', 'closed'].includes(destId)) {
            setMoveModal({
                isOpen: true,
                leadId: draggableId,
                destinationId: destId,
                sourceId: source.droppableId,
                data: {}
            });
            setMoveData({ notes: '', proposedValue: '', appointmentDate: '' });
            return; // Pause move until confirmed
        }

        // Standard Move
        executeMove(draggableId, destination.droppableId);
    };

    const executeMove = async (leadId, status, extraData = {}) => {
        // Optimistic Update
        const updatedLeads = leads.map(lead => {
            if (lead.id.toString() === leadId) {
                return { ...lead, status };
            }
            return lead;
        });

        setLeads(updatedLeads);

        // API Call
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads/${leadId}/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status, ...extraData })
            });
        } catch (error) {
            console.error('Error moving lead', error);
            fetchLeads(); // Revert
        }
    };

    const confirmMove = () => {
        if (moveModal.destinationId === 'negotiation' && !moveData.proposedValue) {
            alert('Por favor, informe o Valor Proposto.');
            return;
        }
        if (moveModal.destinationId === 'scheduled' && !moveData.appointmentDate) {
            alert('Por favor, selecione a Data e Hora do Agendamento.');
            return;
        }
        executeMove(moveModal.leadId, moveModal.destinationId, moveData);
        setMoveModal({ ...moveModal, isOpen: false });
    };

    // ... (rest of functions: handleCreateLead, etc)

    const handleCreateLead = async () => {
        // ... (existing code)
        if (!newLead.name || !newLead.phone) {
            alert('Por favor, preencha Nome e WhatsApp.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/crm/leads/${id}/interaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ type: 'call_manual', content: 'Contato realizado via CRM Board' })
            });
            fetchLeads(); // Refresh to see status change
        } catch (error) {
            console.error(error);
        }
    };

    // ... (Data Tools)
    const downloadTemplate = () => {
        const headers = ["Nome,Telefone,Email,Origem,Campanha,Status"];
        const rows = ["João Silva,5511999999999,joao@email.com,Instagram,Verão 2024,new"];
        const csvContent = "data:text/csv;charset=utf-8," + headers.join("\n") + "\n" + rows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_leads.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',');

            const newLeads = lines.slice(1).filter(line => line.trim() !== '').map((line, index) => {
                const values = line.split(',');
                // Simple CSV mapping based on template: Name, Phone, Email, Source, Campaign, Status
                return {
                    id: Date.now() + index, // Temp ID
                    name: values[0] || 'Sem Nome',
                    phone: values[1] || '',
                    email: values[2] || '',
                    source: values[3] || 'Importado',
                    campaign: values[4] || '',
                    status: 'new', // Always start at 'new'
                    createdAt: new Date().toISOString()
                };
            });

            if (newLeads.length > 0) {
                setLeads(prev => [...prev, ...newLeads]);
                alert(`${newLeads.length} Leads importados com sucesso para a coluna 'Novo Lead'!`);
            } else {
                alert('Nenhum dado válido encontrado no CSV.');
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = null;
    };

    // ... render return ... (Updating to include Modal)
    return (
        <div className="crm-board page-fade-in" style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Actions for Pipeline */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 className="page-title">Gestão Comercial</h2>
                    <p className="page-subtitle">Gerencie seus leads e oportunidades.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
                        <button onClick={downloadTemplate} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }} title="Baixar Modelo CSV">
                            <Download size={16} /> Modelo
                        </button>
                        <div style={{ position: 'relative' }}>
                            <input type="file" accept=".csv" onChange={handleImport} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                            <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>
                                <Upload size={16} /> Importar
                            </button>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={() => setShowNewLeadModal(true)}>
                        <Plus size={18} /> Novo Lead
                    </button>
                </div>
            </div>

            {/* ... Kanban ... */}
            {/* (Keep DragDropContext same, using handleDragEnd updated above) */}
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
                                            backgroundColor: `${column.color}15`,
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
                                            {Array.isArray(colLeads) && colLeads.map((lead, index) => (
                                                lead && (
                                                    <Draggable key={lead.id} draggableId={lead.id ? lead.id.toString() : `lead-${index}`} index={index}>
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
                                                )
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

            {/* Move Stage Modal Prompt */}
            {moveModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>Mover para {columns[moveModal.destinationId]?.title}</h3>
                            <button onClick={() => setMoveModal({ ...moveModal, isOpen: false })}><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
                                {moveModal.destinationId === 'negotiation' ? 'Informe os detalhes da negociação para oficializar.' :
                                    moveModal.destinationId === 'scheduled' ? 'Para quando é o agendamento?' :
                                        moveModal.destinationId === 'connected' ? 'Como foi o contato com o lead?' :
                                            'Por qual motivo este atendimento está sendo encerrado?'}
                            </p>

                            {moveModal.destinationId === 'negotiation' && (
                                <div className="form-group">
                                    <label>Valor Proposto (R$)*</label>
                                    <input
                                        type="text"
                                        value={moveData.proposedValue}
                                        onChange={e => setMoveData({ ...moveData, proposedValue: e.target.value })}
                                        placeholder="Ex: 1500,00"
                                    />
                                </div>
                            )}

                            {moveModal.destinationId === 'scheduled' && (
                                <div className="form-group">
                                    <label>Data e Hora do Agendamento*</label>
                                    <input
                                        type="datetime-local"
                                        value={moveData.appointmentDate}
                                        onChange={e => setMoveData({ ...moveData, appointmentDate: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Observações / Resultado*</label>
                                <textarea
                                    rows={3}
                                    value={moveData.notes}
                                    onChange={e => setMoveData({ ...moveData, notes: e.target.value })}
                                    placeholder="Descreva o que foi conversado..."
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                />
                            </div>

                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setMoveModal({ ...moveModal, isOpen: false })}>Cancelar</button>
                                <button className="btn-primary" onClick={confirmMove}>Confirmar Movimentação</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Lead Modal ... (Same as before) */}

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

// X removed (imported from lucide-react)

export default CRMBoard;
