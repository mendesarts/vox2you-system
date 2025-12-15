
import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Phone, Calendar, X } from 'lucide-react';
import { fetchLeads, createLead, updateLeadStage, enrollStudent } from '../services/api';
import './kanban.css';

import SDRChat from './SDRChat';

const Commercial = () => {
  const [activeTab, setActiveTab] = useState('pipeline'); // pipeline, sdr
  const [columns, setColumns] = useState({
    new: { id: 'new', title: 'Novo Lead', color: '#3b82f6', items: [] },
    qualification: { id: 'qualification', title: 'Qualificação', color: '#f59e0b', items: [] },
    scheduled: { id: 'scheduled', title: 'Consultoria Agendada', color: '#8b5cf6', items: [] },
    done: { id: 'done', title: 'Consultoria Concluída', color: '#10b981', items: [] },
    enrolled: { id: 'enrolled', title: 'Matriculado', color: '#059669', items: [] },
    lost: { id: 'lost', title: 'Perdido', color: '#ef4444', items: [] }
  });

  // Modal States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  // Forms Data
  const [newLead, setNewLead] = useState({ name: '', phone: '', interest: '' });
  const [enrollData, setEnrollData] = useState({ leadId: '', cpf: '', email: '', course: '', classInfo: '' });

  // Drag Data
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedSource, setDraggedSource] = useState(null);

  useEffect(() => {
    if (activeTab === 'pipeline') loadLeads();
  }, [activeTab]);

  const loadLeads = async () => {
    try {
      const leads = await fetchLeads();
      const newColumns = { ...columns };
      Object.keys(newColumns).forEach(key => newColumns[key].items = []);
      leads.forEach(lead => {
        if (newColumns[lead.stage]) newColumns[lead.stage].items.push(lead);
      });
      setColumns(newColumns);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      await createLead(newLead);
      setIsNewLeadOpen(false);
      setNewLead({ name: '', phone: '', interest: '' });
      loadLeads();
    } catch (error) {
      alert('Erro ao criar lead');
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    try {
      await enrollStudent(enrollData);
      setIsEnrollOpen(false);
      setEnrollData({ leadId: '', cpf: '', email: '', course: '', classInfo: '' });
      loadLeads(); // Lead vai para 'enrolled'
      alert('✅ Matrícula realizada com sucesso! Verifique na aba Admin.');
    } catch (error) {
      alert('Erro ao realizar matrícula: ' + error.message);
    }
  };

  const handleDragStart = (e, item, sourceColumnId) => {
    setDraggedItem(item);
    setDraggedSource(sourceColumnId);
    e.dataTransfer.setData('text/plain', item.id);
    e.currentTarget.classList.add('dragging');
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    if (!draggedItem || draggedSource === targetColumnId) return;

    // Se soltar na coluna 'Matriculado', abrir Modal de Matrícula e interromper o drop automático
    if (targetColumnId === 'enrolled') {
      setEnrollData({ ...enrollData, leadId: draggedItem.id }); // Prepara o ID
      setIsEnrollOpen(true); // Abre o Modal
      setDraggedItem(null);
      setDraggedSource(null);
      return; // O Drop real só acontece após preencher o modal
    }

    // Movimentação Normal
    const sourceCol = columns[draggedSource];
    const targetCol = columns[targetColumnId];
    const newSourceItems = sourceCol.items.filter(i => i.id !== draggedItem.id);
    const newTargetItems = [...targetCol.items, { ...draggedItem, stage: targetColumnId }];

    setColumns({
      ...columns,
      [draggedSource]: { ...sourceCol, items: newSourceItems },
      [targetColumnId]: { ...targetCol, items: newTargetItems }
    });

    try {
      await updateLeadStage(draggedItem.id, targetColumnId);
    } catch (error) {
      loadLeads();
    }

    setDraggedItem(null);
    setDraggedSource(null);
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDragEnd = (e) => e.currentTarget.classList.remove('dragging');

  return (
    <div className="kanban-page page-fade-in">
      <header className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h2 className="page-title">Comercial</h2>
          <p className="page-subtitle">Gestão de Pipeline e Agente IA.</p>
        </div>
        {activeTab === 'pipeline' && (
          <button className="btn-primary" onClick={() => setIsNewLeadOpen(true)}>
            <Plus size={18} /> Novo Lead
          </button>
        )}
      </header>

      <div className="tabs" style={{ display: 'flex', gap: '20px', padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pipeline')}
          style={{
            paddingBottom: '10px',
            borderBottom: activeTab === 'pipeline' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'pipeline' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600
          }}
        >
          Pipeline de Vendas
        </button>
        <button
          onClick={() => setActiveTab('sdr')}
          style={{
            paddingBottom: '10px',
            borderBottom: activeTab === 'sdr' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'sdr' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600
          }}
        >
          Agente SDR (IA)
        </button>
      </div>

      {activeTab === 'sdr' && <SDRChat />}

      {activeTab === 'pipeline' && (
        <div className="kanban-board">
          {Object.values(columns).map(column => (
            <div
              key={column.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="column-header" style={{ borderTopColor: column.color }}>
                <div className="column-title">
                  <span className="dot" style={{ background: column.color }}></span>
                  {column.title}
                  <span className="count">{column.items.length}</span>
                </div>
              </div>

              <div className="column-content">
                {column.items.map(item => (
                  <div
                    key={item.id}
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, column.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="card-header">
                      <h4 className="card-title">{item.name}</h4>
                      <span className="card-tag">{item.interest}</span>
                    </div>
                    <div className="card-info">
                      <div className="info-row"><Phone size={12} /> {item.phone}</div>
                    </div>
                    <div className="card-footer">
                      <div className="avatar">{item.name.substring(0, 2).toUpperCase()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Lead */}
      {isNewLeadOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Novo Lead</h3>
              <button onClick={() => setIsNewLeadOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateLead}>
              <div className="form-group">
                <label>Nome Completo</label>
                <input required type="text" value={newLead.name} onChange={e => setNewLead({ ...newLead, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>WhatsApp</label>
                <input required type="text" value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Interesse</label>
                <select value={newLead.interest} onChange={e => setNewLead({ ...newLead, interest: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option value="Oratória">Oratória</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Liderança">Liderança</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsNewLeadOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-confirm">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Matrícula */}
      {isEnrollOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>🎓 Realizar Matrícula</h3>
              <button onClick={() => setIsEnrollOpen(false)}><X size={20} /></button>
            </div>
            <p style={{ marginBottom: 20, color: '#94a3b8' }}>Preencha os dados finais para efetivar o aluno.</p>
            <form onSubmit={handleEnrollStudent}>
              <div className="form-group">
                <label>CPF</label>
                <input required type="text" placeholder="000.000.000-00" value={enrollData.cpf} onChange={e => setEnrollData({ ...enrollData, cpf: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email para Contrato</label>
                <input required type="email" value={enrollData.email} onChange={e => setEnrollData({ ...enrollData, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Curso Escolhido</label>
                <select required value={enrollData.course} onChange={e => setEnrollData({ ...enrollData, course: e.target.value })}>
                  <option value="">Selecione...</option>
                  <option value="Oratória e Comunicação">Oratória e Comunicação</option>
                  <option value="Vendas e Negociação">Vendas e Negociação</option>
                  <option value="Liderança de Alta Performance">Liderança de Alta Performance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Turma</label>
                <input required type="text" placeholder="Ex: Turma A - Seg/Qua Noite" value={enrollData.classInfo} onChange={e => setEnrollData({ ...enrollData, classInfo: e.target.value })} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEnrollOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-confirm" style={{ background: '#059669' }}>Confirmar Matrícula</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Commercial;
