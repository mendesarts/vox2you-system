import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Clock, MessageCircle, AlertCircle, Phone, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const KanbanCard = ({ lead, index, onClick }) => {
    const { user } = useAuth();

    if (!lead || !lead.id) return null;

    // --- Helpers ---
    const getFirstTwoNames = (name) => {
        if (!name) return 'Sem Nome';
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 2) return name;
        return `${parts[0]} ${parts[1]}`;
    };

    const getResponsibleName = (name) => {
        if (!name || name === 'Sem Dono') return 'Sem resp.';
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 2) return name;
        return `${parts[0]} ${parts[1]}`;
    };

    const formatMoney = (val) => {
        if (!val) return null;
        return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // --- Data Prep ---
    const value = Number(lead.sales_value) || Number(lead.value) || 0;
    const responsible = getResponsibleName(lead.responsible);

    // Permission Logic: Global (1,10), Gestão/Proprietários (20), Liderança/Direção (30)
    const showResponsible = user && [1, 10, 20, 30].includes(Number(user.roleId));

    // Parse Tags
    let tags = [];
    try {
        if (Array.isArray(lead.tags)) tags = lead.tags;
        else if (typeof lead.tags === 'string') {
            const trimmed = lead.tags.trim();
            if (trimmed.startsWith('[')) {
                const parsed = JSON.parse(trimmed);
                tags = Array.isArray(parsed) ? parsed : [parsed];
            } else if (trimmed.includes(',')) {
                tags = trimmed.split(',').map(t => t.trim());
            } else {
                tags = [trimmed];
            }
        }
    } catch (e) { tags = [] }
    tags = tags.filter(t => t && t !== '[]' && typeof t === 'string' && t.length > 1);

    const getLeadAge = () => {
        if (!lead.createdAt) return 0;
        const now = new Date();
        const created = new Date(lead.createdAt);
        const diffMs = now - created;
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    };
    const leadAge = getLeadAge();

    const getAgeInfo = () => {
        const diff = leadAge;
        if (diff === 0) return { text: 'Hoje', color: '#34C759' };
        return { text: `${diff}d`, color: '#FF3B30' };
    };
    const ageInfo = getAgeInfo();

    // Task Status Logic
    const getTaskStatus = () => {
        // Verifica se há tarefas associadas ao lead
        if (!lead.tasks || !Array.isArray(lead.tasks) || lead.tasks.length === 0) {
            return { color: '#D1D5DB', tooltip: 'Sem tarefas' }; // Cinza se não houver tarefas
        }

        // Pega a última tarefa (mais recente)
        const lastTask = lead.tasks[lead.tasks.length - 1];

        if (!lastTask.dueDate) {
            return { color: '#D1D5DB', tooltip: 'Sem data definida' };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(lastTask.dueDate);
        taskDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { color: '#EF4444', tooltip: `Tarefa atrasada (${Math.abs(diffDays)}d)` }; // Vermelho
        } else if (diffDays === 0) {
            return { color: '#F59E0B', tooltip: 'Tarefa vence hoje' }; // Laranja
        } else {
            return { color: '#10B981', tooltip: `Tarefa em ${diffDays} dia(s)` }; // Verde
        }
    };
    const taskStatus = getTaskStatus();

    // Card Background Logic
    let cardBg = '#FFFFFF';
    const s = (lead.status || '').toLowerCase();
    if (['won', 'closed_won', 'matriculado'].includes(s)) {
        cardBg = '#DCFCE7'; // Green-100
    } else if (['closed', 'lost', 'closed_lost', 'archived'].includes(s)) {
        cardBg = '#E2E8F0'; // Slate-200
    }

    return (
        <Draggable draggableId={String(lead.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(lead)}
                    style={{
                        ...provided.draggableProps.style,
                        width: '100%',
                        boxSizing: 'border-box',
                        background: cardBg,
                        borderRadius: '6px',
                        padding: '10px 12px',
                        marginBottom: '1px',
                        border: '1px solid #E5E5EA',
                        boxShadow: snapshot.isDragging
                            ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                            : 'none',
                        transform: snapshot.isDragging ? 'rotate(1deg)' : 'none',
                        transition: 'box-shadow 0.2s ease',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'flex-start'
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = snapshot.isDragging ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none'}
                >
                    {/* CONTENT */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Name */}
                        <div style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: '#1C1C1E',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }} title={lead.name}>
                            {getFirstTwoNames(lead.name)}
                        </div>

                        {/* Lead ID */}
                        <div style={{ fontSize: '12px', color: '#007AFF', fontWeight: '600' }}>
                            Lead #{lead.origin_id_importado || lead.id}
                        </div>

                        {/* Responsible */}
                        {showResponsible && (
                            <div style={{
                                fontSize: '11px',
                                color: '#8E8E93',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {responsible}
                            </div>
                        )}

                        {/* Tags */}
                        {tags.length > 0 && (
                            <div style={{
                                fontSize: '10px',
                                color: '#8E8E93',
                                background: '#F2F2F7',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                width: 'fit-content',
                                maxWidth: '100%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {tags.slice(0, 2).join(', ')}
                                {tags.length > 2 && ` +${tags.length - 2}`}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: Indicators Stacked */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '4px',
                        flexShrink: 0
                    }}>
                        {/* Date */}
                        <span style={{ fontSize: '10px', color: '#8E8E93', whiteSpace: 'nowrap' }}>
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit',
                                year: 'numeric'
                            }) : ''}
                        </span>

                        {/* Task Status Circle */}
                        <div 
                            title={taskStatus.tooltip}
                            style={{ 
                                width: '10px', 
                                height: '10px', 
                                borderRadius: '50%',
                                background: taskStatus.color,
                                border: '2px solid white',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                cursor: 'help',
                                flexShrink: 0
                            }}
                        />

                        {/* Temperature */}
                        {(lead.temperature === 'hot' || lead.temperature === 'cold') && (
                            <span style={{ fontSize: '12px', lineHeight: 1 }}>
                                {lead.temperature === 'hot' ? '🔥' : '❄️'}
                            </span>
                        )}

                        {/* Days Badge or Closing Date */}
                        {!['won', 'closed_won', 'matriculado', 'closed', 'lost', 'closed_lost', 'archived', 'encerrado'].includes(s) ? (
                            <div style={{ 
                                background: ageInfo.color === '#34C759' ? '#34C759' : '#FF3B30',
                                color: 'white',
                                padding: '1px 5px',
                                borderRadius: '8px',
                                fontSize: '8px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.2
                            }}>
                                {ageInfo.text}
                            </div>
                        ) : (
                            <div style={{ fontSize: '9px', color: '#8E8E93', whiteSpace: 'nowrap', fontWeight: '800', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '2px' }}>
                                F: {new Date(lead.updatedAt || lead.createdAt).toLocaleDateString('pt-BR', { 
                                    day: '2-digit', 
                                    month: '2-digit'
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default KanbanCard;
