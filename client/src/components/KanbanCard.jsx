import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Phone, MapPin, User, Calendar } from 'lucide-react';

const KanbanCard = ({ lead, index, onClick }) => {

    // Format Value (R$)
    const formatValue = (val) => {
        if (!val) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Identify Owner
    const ownerName = lead.responsible || lead.user || "Sem dono";

    // Identify Unit
    const leadUnit = lead.unit || "Sem Unidade";

    return (
        <Draggable draggableId={String(lead.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(lead)}
                    style={{ ...provided.draggableProps.style }}
                    className={`
            bg-white p-4 rounded-lg shadow-sm mb-3 border border-gray-100 
            group hover:shadow-md transition-all cursor-pointer relative
            ${snapshot.isDragging ? "shadow-lg ring-2 ring-indigo-500 rotate-2" : ""}
          `}
                >
                    {/* 1. TOP: Title and Value */}
                    <div className="flex justify-between items-start mb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <h4 className="font-bold text-gray-800 text-sm leading-snug w-3/4 pr-2" style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.875rem', lineHeight: '1.375', width: '75%', paddingRight: '8px', margin: 0 }}>
                            {lead.title || lead.contact?.name || "Novo Negócio"}
                        </h4>
                        {lead.value > 0 && (
                            <span className="shrink-0 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100" style={{ flexShrink: 0, backgroundColor: '#ecfdf5', color: '#047857', fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', border: '1px solid #d1fae5' }}>
                                {formatValue(lead.value)}
                            </span>
                        )}
                    </div>

                    {/* 2. MIDDLE: Info (Phone and Unit) */}
                    <div className="space-y-2 mb-4" style={{ marginBottom: '16px' }}>
                        {/* Contact Name (if different from title) */}
                        {lead.contact?.name && lead.contact.name !== lead.title && (
                            <div className="text-xs text-gray-600 flex items-center gap-2" style={{ fontSize: '0.75rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <User size={14} className="text-gray-400" style={{ color: '#9ca3af' }} />
                                <span className="truncate" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.contact.name}</span>
                            </div>
                        )}

                        {/* Phone */}
                        {lead.contact?.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-2" style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <Phone size={14} className="text-gray-400" style={{ color: '#9ca3af' }} />
                                <span className="font-mono" style={{ fontFamily: 'monospace' }}>{lead.contact.phone}</span>
                            </div>
                        )}

                        {/* Unit */}
                        <div className="text-xs text-indigo-600 flex items-center gap-2 bg-indigo-50 p-1.5 rounded w-fit max-w-full" style={{ fontSize: '0.75rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#eef2ff', padding: '6px', borderRadius: '4px', width: 'fit-content', maxWidth: '100%' }}>
                            <MapPin size={12} className="shrink-0" style={{ flexShrink: 0 }} />
                            <span className="truncate font-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{leadUnit}</span>
                        </div>
                    </div>

                    {/* 3. BOTTOM: Separator and Owner */}
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                        {/* Owner Avatar */}
                        <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white" style={{ height: '24px', width: '24px', borderRadius: '50%', backgroundColor: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700', boxShadow: '0 0 0 2px white' }}>
                                {ownerName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-500 font-medium truncate max-w-[100px]" style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }} title={ownerName}>
                                {ownerName}
                            </span>
                        </div>

                        {/* Date or ID */}
                        <div className="text-[10px] text-gray-300 flex items-center gap-1" style={{ fontSize: '10px', color: '#d1d5db', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} />
                            {new Date(lead.createdAt || Date.now()).toLocaleDateString('pt-BR')}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default KanbanCard;
