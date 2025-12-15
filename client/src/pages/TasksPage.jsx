import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, AlertTriangle, Briefcase, GraduationCap, DollarSign, ArrowRight } from 'lucide-react';
import './tasks.css';

const TasksPage = () => {
    const [tasks, setTasks] = useState({ pedagogical: [], administrative: [], commercial: [] });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${apiUrl}/tasks`);
            const data = await res.json();

            if (Array.isArray(data)) {
                setTasks({
                    pedagogical: data.filter(t => t.category === 'pedagogical'),
                    administrative: data.filter(t => t.category === 'administrative'),
                    commercial: data.filter(t => t.category === 'commercial')
                });
            } else if (data && data.pedagogical) {
                // Backwards compatibility or if backend returns formatted object
                setTasks(data);
            } else {
                console.warn('Formato de dados inesperado:', data);
                // Keep empty state to avoid crash
            }
        } catch (error) {
            console.error('Erro ao buscar tarefas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (task) => {
        if (task.link) {
            navigate(task.link, { state: task.state || {} });
        }
    };

    const TaskCard = ({ task, color }) => (
        <div className="task-card" onClick={() => handleNavigate(task)}>
            <div className="task-icon" style={{ background: `${color}20`, color: color }}>
                {task.priority === 'high' ? <AlertTriangle size={20} /> : <CheckSquare size={20} />}
            </div>
            <div className="task-content">
                <h4 className="task-title">{task.title}</h4>
                <p className="task-desc">{task.description}</p>
                <div className="task-action" style={{ color: color }}>
                    {task.action} <ArrowRight size={14} />
                </div>
            </div>
        </div>
    );

    const Section = ({ title, icon: Icon, items = [], color }) => (
        <div className="task-section">
            <h3 className="section-header" style={{ borderLeft: `4px solid ${color}` }}>
                <Icon size={20} color={color} /> {title}
                <span className="badge">{items.length}</span>
            </h3>
            <div className="section-grid">
                {items.length > 0 ? (
                    items.map(task => <TaskCard key={task.id} task={task} color={color} />)
                ) : (
                    <div className="empty-state">Nenhuma pendência.</div>
                )}
            </div>
        </div>
    );

    if (loading) return <div className="page-loading">Carregando pendências...</div>;

    return (
        <div className="tasks-page page-fade-in">
            <header className="page-header">
                <div>
                    <h2 className="page-title">Painel de Tarefas</h2>
                    <p className="page-subtitle">Central de pendências e prioridades do dia.</p>
                </div>
            </header>

            <div className="tasks-container">
                <Section
                    title="Pedagógico"
                    icon={GraduationCap}
                    items={tasks.pedagogical}
                    color="#8b5cf6"
                />

                <Section
                    title="Comercial"
                    icon={Briefcase}
                    items={tasks.commercial}
                    color="#f59e0b"
                />

                <Section
                    title="Administrativo & Financeiro"
                    icon={DollarSign}
                    items={tasks.administrative}
                    color="#10b981"
                />
            </div>

        </div>
    );
};

export default TasksPage;
