// ⚠️ ATTENTION: Read ARCHITECTURE_GUIDELINES.md in the root directory before modifying logic related to roles, units, or permissions. Always use numeric roleId [1, 10, etc.] and unitId.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Plus, Search, Filter, Phone, Calendar, DollarSign, Clock, MoreVertical, X, Check, MapPin, FileText, Upload, Download, Mail, Building, Tag, Trash2, User, MessageSquare, ChevronLeft, Thermometer, Brain, ArrowRight, PhoneOff, Settings, LayoutList, LayoutGrid, ArrowLeftRight, GraduationCap } from 'lucide-react';
import KanbanCard from '../components/KanbanCard';
import FilterModal from './components/FilterModal';
import LeadDetailsModal from './components/LeadDetailsModal';
import ImportLeadsModal from './components/ImportLeadsModal';
import EnrollmentModal from '../components/EnrollmentModal';
import QuickAddLeadModal from './components/QuickAddLeadModal';
import { useAuth } from '../context/AuthContext';
import { VoxModal } from '../components/VoxUI';
import * as XLSX from 'xlsx';

import api from '../services/api';
import DashboardFilters from '../components/DashboardFilters';

const GLOBAL_VIEW_ROLES = [1, 10]; // Master and Director only
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Helper para CSV Import (Case Insensitive + Normalização)
const normalizeKey = (row, keys) => {
    const rowKeys = Object.keys(row).map(k => k.toLowerCase().trim());
    const foundKey = keys.find(k => rowKeys.includes(k.toLowerCase()));
    const originalKey = Object.keys(row).find(k => k.toLowerCase().trim() === foundKey);
    return originalKey ? row[originalKey] : null;
};

const getInitialLeadState = () => ({
    title: '',
    value: '',
    name: '',
    phone: '',
    email: '',
    company: '',
    city: '',
    neighborhood: '',
    address: '',
    cpf: '',
    rg: '',
    birthDate: '',
    profession: '',
    courseInterest: '',
    lossReason: '',
    source: 'Instagram',
    campaign: '',
    tags: '',
    unit: '',
    responsible: '',
    responsibleId: '',
    status: 'new',
    attempts: new Array(5).fill({ date: '', result: '' }),
    nextTaskDate: '',
    nextTaskType: 'Nova Tentativa',
    observation: '',
    contactSummary: '',
    temperature: 'cold'
});

const CRMBoard = () => {
    const { user, selectedUnit } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewLeadModal, setShowNewLeadModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [formStep, setFormStep] = useState(1); // 1 = Dados, 2 = Histórico
    const [selectedLead, setSelectedLead] = useState(null);
    const [unitFilter, setUnitFilter] = useState('all'); // Master Filter
    const [allLeads, setAllLeads] = useState([]);
    const [consultants, setConsultants] = useState([]);
    const fileInputRef = useRef(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('crm');
    const [isSaving, setIsSaving] = useState(false);
    const [holidays, setHolidays] = useState([]);
    const [units, setUnits] = useState([]);
    const [courses, setCourses] = useState([]);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        unitId: 'all',
        responsibleId: 'all',
        source: 'all',
        temperature: 'all',
        startDate: '',
        endDate: '',
        period: 'month' // Default to month so startDate is set and restrict logic works naturally, until 'all' is clicked
    });

    // New UI State
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'list'
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTargetId, setTransferTargetId] = useState('');

    const [highlightedLeadId, setHighlightedLeadId] = useState(null);
    const settingsRef = useRef(null);

    // Auto-clear highlight after 4 seconds
    useEffect(() => {
        if (highlightedLeadId) {
            const timer = setTimeout(() => {
                setHighlightedLeadId(null);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [highlightedLeadId]);

    // Importado Stats Logic
    const stats = React.useMemo(() => {
        const now = new Date();
        const todayStr = now.toDateString();

        let todayCount = 0;
        let noTaskCount = 0;
        let overdueCount = 0;
        let newTodayCount = 0;
        let newYesterdayCount = 0;

        leads.forEach(l => {
            if (!l.nextTaskDate) {
                noTaskCount++;
            } else {
                const taskDate = new Date(l.nextTaskDate);
                if (taskDate < now && taskDate.toDateString() !== todayStr) overdueCount++;
                else if (taskDate.toDateString() === todayStr) todayCount++;
            }

            if (l.createdAt) {
                const createdDate = new Date(l.createdAt);
                if (createdDate.toDateString() === todayStr) newTodayCount++;
                // Yesterday check could be added
            }
        });

        const totalValue = leads.reduce((acc, l) => acc + (l.value || l.sales_value || 0), 0);

        return { todayCount, noTaskCount, overdueCount, newTodayCount, totalValue, totalLeads: leads.length };
    }, [leads]);

    // Close settings when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (settingsRef.current && !settingsRef.current.contains(event.target)) {
                setShowSettingsMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // New Lead Form State
    const [showQuickAddModal, setShowQuickAddModal] = useState(false);
    const [newLead, setNewLead] = useState(getInitialLeadState());

    const formatPhone = (value) => {
        if (!value) return '';
        const v = value.replace(/\D/g, '');
        // Support Country Code (e.g. 55 + 11 digits = 13)
        if (v.length > 13) {
            return '+' + v.slice(0, 2) + ' (' + v.slice(2, 4) + ') ' + v.slice(4, 9) + '-' + v.slice(9, 13);
        }
        if (v.length === 13) {
            return '+' + v.slice(0, 2) + ' (' + v.slice(2, 4) + ') ' + v.slice(4, 9) + '-' + v.slice(9);
        }
        if (v.length === 12) {
            return '+' + v.slice(0, 2) + ' (' + v.slice(2, 4) + ') ' + v.slice(4, 8) + '-' + v.slice(8);
        }
        if (v.length > 11) return v;
        if (v.length === 11) {
            return '(' + v.slice(0, 2) + ') ' + v.slice(2, 7) + '-' + v.slice(7);
        }
        if (v.length === 10) {
            return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
        }
        if (v.length > 9) return v;
        if (v.length > 6) {
            return '(' + v.slice(0, 2) + ') ' + v.slice(2, 6) + '-' + v.slice(6);
        }
        if (v.length > 2) {
            return '(' + v.slice(0, 2) + ') ' + v.slice(2);
        }
        return v;
    };

    const formatCurrency = (value) => {
        if (!value) return '';
        const v = value.toString().replace(/\D/g, '');
        const numberValue = parseFloat(v) / 100;
        return isNaN(numberValue) ? '' : numberValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    // Kanban Columns Configuration
    const columns = {
        'new': { id: 'new', title: 'Novo Lead', color: '#3b82f6', icon: Plus },
        'connecting': { id: 'connecting', title: 'Conectando', color: '#8b5cf6', icon: Phone },
        'connected': { id: 'connected', title: 'Conexão', color: '#6366f1', icon: Check },
        'scheduled': { id: 'scheduled', title: 'Agendamento', color: '#f59e0b', icon: Calendar },
        'no_show': { id: 'no_show', title: 'Bolo', color: '#ef4444', icon: Clock },
        'negotiation': { id: 'negotiation', title: 'Negociação', color: '#10b981', icon: DollarSign },
        'won': { id: 'won', title: 'Matricular', color: '#059669', icon: Check },
        'closed': { id: 'closed', title: 'Encerrado', color: '#6b7280', icon: X },
    };

    const crmOrder = ['new', 'connecting', 'connected', 'scheduled', 'no_show', 'negotiation', 'won', 'closed'];

    const getColumnOrder = () => {
        return crmOrder;
    };

    // Interaction Modal State
    const [interactionModal, setInteractionModal] = useState({ isOpen: false, lead: null });
    const [interactionData, setInteractionData] = useState({
        date: '',
        channel: 'WhatsApp',
        result: '', // 'success_scheduled', 'success_no_schedule', 'failure'
        scheduleDate: '',
        nextAttemptDate: ''
    });

    const handleOpenInteraction = (lead, initialResult = '') => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - tzOffset)).toISOString().slice(0, 16);

        // Suggest 4 hours later for next attempt
        const fourHoursLater = new Date(now.getTime() + (4 * 60 * 60 * 1000));
        const localNextAttempt = (new Date(fourHoursLater - tzOffset)).toISOString().slice(0, 16);

        setInteractionModal({ isOpen: true, lead });
        setInteractionData({
            date: localISOTime,
            channel: 'WhatsApp',
            result: initialResult,
            scheduleDate: localNextAttempt, // Default suggestion if needed
            nextAttemptDate: localNextAttempt
        });
    };

    const confirmInteraction = async () => {
        if (!interactionModal.lead || !interactionData.result) return;

        const leadId = interactionModal.lead.id;
        const updates = {};

        // Parse Date for Display
        const dateObj = new Date(interactionData.date);
        const dateStr = dateObj.toLocaleDateString('pt-BR') + ' ' + dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        let resultLabel = '';

        if (interactionData.result === 'success_scheduled') {
            if (!interactionData.scheduleDate) return alert('Selecione a data do agendamento.');
            updates.status = 'scheduled';
            updates.appointmentDate = interactionData.scheduleDate; // Specifically for Appointment
            updates.nextTaskDate = interactionData.scheduleDate;
            updates.nextTaskType = 'Reunião Agendada';
            resultLabel = 'Sucesso com Agendamento';

        } else if (interactionData.result === 'success_no_schedule') {
            updates.status = 'connected';
            updates.nextTaskDate = interactionData.nextAttemptDate;
            updates.nextTaskType = 'Nova Tentativa';
            resultLabel = 'Sucesso sem Agendamento';

        } else if (interactionData.result === 'failure') {
            if (interactionModal.lead.status === 'new') {
                updates.status = 'connecting';
            } else {
                updates.status = interactionModal.lead.status; // Keep status
            }
            updates.nextTaskDate = interactionData.nextAttemptDate;
            updates.nextTaskType = 'Nova Tentativa';
            resultLabel = 'Insucesso';
        }

        // Construct Note for History
        updates.notes = `${dateStr} - Conexão via ${interactionData.channel}. Resultado: ${resultLabel}.`;

        try {
            // Use the MOVE endpoint which handles Task Creation and Status Logic
            const res = await api.put(`/crm/leads/${leadId}/move`, updates);
            const updatedLead = res.data;

            // Update Local State
            setLeads(prev => prev.map(l => l.id === leadId ? updatedLead : l));
            if (selectedLead && selectedLead.id === leadId) {
                setSelectedLead(updatedLead);
            }

            setInteractionModal({ isOpen: false, lead: null });
            setShowNewLeadModal(false);
        } catch (error) {
            console.error('Error saving interaction:', error);
            alert('Erro ao salvar interação.');
        }
    };

    // Fallback for logic that uses 'columnOrder' variable directly if any
    const columnOrder = getColumnOrder();

    const getLeadsByStatus = (status) => {
        let list = [...leads];
        const isRestrictedColumn = (status === 'won' || status === 'closed');

        // 1. Funnel Filter (Tab based)
        list = list.filter(l => {
            const f = l.funnel || 'crm';
            return f === 'crm' || f === '';
        });

        // 2. Multi-Filter Logic
        if (activeFilters.specialFilter === 'no_task') {
            list = list.filter(l => !l.nextTaskDate);
        }
        if (activeFilters.specialFilter === 'overdue') {
            const now = new Date();
            list = list.filter(l => l.nextTaskDate && new Date(l.nextTaskDate) < now);
        }
        if (activeFilters.name) {
            const n = activeFilters.name.toLowerCase();
            list = list.filter(l => (l.name || '').toLowerCase().includes(n) || (l.phone || '').includes(n));
        }

        if (activeFilters.status && activeFilters.status !== 'all') {
            if (activeFilters.status === 'active') {
                const finalStatuses = ['won', 'closed', 'lost', 'archived', 'closed_won', 'matriculado', 'closed_lost'];
                list = list.filter(l => !finalStatuses.includes(l.status));
            } else {
                list = list.filter(l => l.status === activeFilters.status);
            }
        }
        if (activeFilters.unitId && activeFilters.unitId !== 'all') {
            list = list.filter(l => Number(l.unitId) === Number(activeFilters.unitId));
        }
        if (activeFilters.responsibleId && activeFilters.responsibleId !== 'all') {
            list = list.filter(l => Number(l.responsibleId) === Number(activeFilters.responsibleId));
        }
        if (activeFilters.source && activeFilters.source !== 'all') {
            list = list.filter(l => l.source === activeFilters.source);
        }
        if (activeFilters.temperature && activeFilters.temperature !== 'all') {
            list = list.filter(l => l.temperature === activeFilters.temperature);
        }

        // Date Filters (Global)
        // For restricted columns (Won/Closed), we use updatedAt (modified date)
        // For others, we use createdAt (creation date)
        if (activeFilters.startDate) {
            const start = new Date(activeFilters.startDate).getTime();
            list = list.filter(l => {
                const dateToCompare = isRestrictedColumn ? (l.updatedAt || l.createdAt) : l.createdAt;
                return new Date(dateToCompare).getTime() >= start;
            });
        }
        if (activeFilters.endDate) {
            const end = new Date(activeFilters.endDate).getTime();
            list = list.filter(l => {
                const dateToCompare = isRestrictedColumn ? (l.updatedAt || l.createdAt) : l.createdAt;
                return new Date(dateToCompare).getTime() <= end;
            });
        }

        // 3. Default Restriction for Won/Closed columns when no global date filter is explicitly set
        // This ensures old historic data doesn't clutter the day-to-day view
        if (isRestrictedColumn && !activeFilters.startDate) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            list = list.filter(l => {
                const d = new Date(l.updatedAt || l.createdAt);
                return d >= startOfMonth;
            });
        }

        return list
            .filter(lead => {
                if (status === 'won') return lead.status === 'won' || lead.status === 'closed_won' || lead.status === 'matriculado';
                if (status === 'closed') return lead.status === 'closed' || lead.status === 'lost' || lead.status === 'closed_lost' || lead.status === 'archived';
                return lead.status === status;
            })
            .sort((a, b) => {
                // Sort by nextTaskDate if available
                const dateA = a.nextTaskDate ? new Date(a.nextTaskDate) : null;
                const dateB = b.nextTaskDate ? new Date(b.nextTaskDate) : null;

                if (dateA && dateB) return dateA - dateB;
                if (dateA) return -1;
                if (dateB) return 1;

                // Fallback to createdAt (newest first)
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    };

    useEffect(() => {
        const targetUnit = selectedUnit || 'all';
        setActiveFilters(prev => ({ ...prev, unitId: targetUnit }));
        fetchLeads({ unitId: targetUnit });

        fetchConsultants();
        fetchUnits();
        fetchCourses();
    }, [user.unitId, selectedUnit]);

    useEffect(() => {
        if (location.state?.openLeadId && leads.length > 0) {
            console.log('Auto-opening lead:', location.state.openLeadId);
            const lead = leads.find(l => Number(l.id) === Number(location.state.openLeadId));
            if (lead) {
                handleOpenEditLead(lead);
                // Clear the state via navigate to ensure useLocation hook updates
                navigate(location.pathname, { replace: true, state: { ...location.state, openLeadId: null } });

                if (location.state.mode === 'enrollment') {
                    setFormStep(2);
                } else if (location.state.section === 'agenda') {
                    setFormStep(3);
                }
            }
        }
    }, [location.state, leads, navigate]);

    const fetchUnits = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL + '/units', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setUnits(data);
            }
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const fetchConsultants = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL + '/users', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();

            if (Array.isArray(data)) {
                const isGlobalRequester = [1, 10].includes(Number(user.roleId));

                const unitUsers = data.filter(u => {
                    // Filter by Unit: Only show users of the same unit, or all if requester is Master/Director
                    const sameUnit = Number(u.unitId) === Number(user.unitId);
                    if (!isGlobalRequester && !sameUnit) return false;

                    // Filter by Role: Commercial (40, 41) or has it in secondaryRoles
                    const primaryRole = Number(u.roleId);
                    const secondary = Array.isArray(u.secondaryRoles) ? u.secondaryRoles.map(Number) : [];
                    const isCommercial = [40, 41].includes(primaryRole) || secondary.some(r => [40, 41].includes(r));

                    // Always allow the current user to be their own responsible
                    // Also usually allow Franchisees (20) and Managers (30) as they manage the sales process
                    const isLeadership = [20, 30].includes(primaryRole);

                    return isCommercial || isLeadership || u.id === user.id;
                });

                const ROLE_PRIORITY = {
                    1: 1, 10: 1, // Master/Director
                    20: 3, // Franqueado
                    30: 4, // Gerente Geral
                    40: 5, // Lider Comercial
                    41: 6, // Consultor
                    50: 7  // Lider Pedagogico
                };

                const sorted = unitUsers.sort((a, b) => {
                    if (a.id === user.id) return -1;
                    if (b.id === user.id) return 1;
                    const pA = ROLE_PRIORITY[Number(a.roleId)] || 99;
                    const pB = ROLE_PRIORITY[Number(b.roleId)] || 99;
                    return pA - pB;
                });
                setConsultants(sorted);
            }
        } catch (error) {
            console.error('Error fetching consultants:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL + '/courses', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            if (Array.isArray(data)) setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchLeads = async (filtersOverride = {}) => {
        try {
            const token = localStorage.getItem('token');
            const filters = { ...activeFilters, ...filtersOverride };

            // Build Query
            const query = new URLSearchParams();
            if (filters.unitId && filters.unitId !== 'all') query.append('unitId', filters.unitId);
            if (filters.startDate) query.append('startDate', filters.startDate);
            if (filters.endDate) query.append('endDate', filters.endDate);

            const res = await fetch(`${API_URL}/crm/leads?${query.toString()}`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await res.json();
            let fetchedLeads = Array.isArray(data) ? data : [];

            // Fetch Holidays for Smart Flow
            try {
                const hRes = await fetch(API_URL + '/calendar/holidays', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                const hData = await hRes.json();
                setHolidays(Array.isArray(hData) ? hData : []);
            } catch (e) {
                console.error('Error fetching holidays', e);
            }

            // The backend already filters leads by unitId for non-global roles.
            // Any additional frontend filtering is redundant and can cause issues if types don't match.
            setLeads(fetchedLeads);
            setAllLeads(fetchedLeads);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [moveModal, setMoveModal] = useState({ isOpen: false, leadId: null, destinationId: null, sourceId: null, data: {}, step: 'details' });
    const [moveData, setMoveData] = useState({
        notes: '',
        proposedValue: '',
        appointmentDate: '',
        appointmentType: 'Presencial',
        outcome: 'success',
        scheduledMeeting: 'no'
    });

    // Enrollment Modal State
    const [enrollmentModal, setEnrollmentModal] = useState({ isOpen: false, lead: null });

    // Helper: Business Hours (9h - 19h, Weekdays) + Holidays
    const calculateNextAttempt = (baseDate) => {
        let target = new Date(baseDate);
        target.setHours(target.getHours() + 4); // Add exactly 4 hours

        const isHoliday = (date) => {
            return holidays.some(h => {
                const start = new Date(h.startDate);
                const end = new Date(h.endDate || h.startDate);
                const d = new Date(date);
                d.setHours(0, 0, 0, 0);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return d >= start && d <= end;
            });
        };

        // Get limits from user profile or default
        let startHour = 9;
        let endHour = 19;

        if (user && user.workingHours) {
            try {
                const wh = user.workingHours;
                if (wh.start) startHour = parseInt(wh.start.toString().split(':')[0]);
                if (wh.end) endHour = parseInt(wh.end.toString().split(':')[0]);
            } catch (e) { console.log('Error parsing workingHours', e); }
        }

        // Adjust to business hours (non-recursive to avoid double-adding)
        let adjusted = false;

        // Check if weekend or holiday
        while (target.getDay() === 0 || target.getDay() === 6 || isHoliday(target)) {
            target.setDate(target.getDate() + 1);
            target.setHours(startHour, 0, 0, 0);
            adjusted = true;
        }

        // Check if outside business hours
        if (!adjusted) {
            if (target.getHours() >= endHour) {
                // After end hour -> next day at start hour
                target.setDate(target.getDate() + 1);
                target.setHours(startHour, 0, 0, 0);
            } else if (target.getHours() < startHour) {
                // Before start hour -> today at start hour
                target.setHours(startHour, 0, 0, 0);
            }
        }

        // Format Human Readable String
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const options = { hour: '2-digit', minute: '2-digit' };
        const timeStr = target.toLocaleTimeString('pt-BR', options);

        let relativeDay = '';
        if (target.toDateString() === now.toDateString()) {
            relativeDay = 'Hoje';
        } else if (target.toDateString() === tomorrow.toDateString()) {
            relativeDay = 'Amanhã';
        } else {
            const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
            relativeDay = days[target.getDay()];
        }

        return {
            date: target,
            formatted: (relativeDay) + ' às ' + (timeStr)
        };
    };

    const handleCloseMoveModal = () => {
        // Revert Optimistic Move if cancelled
        if (moveModal.leadId && moveModal.sourceId && moveModal.destinationId) {
            setLeads(prev => prev.map(l => {
                if (l.id.toString() === moveModal.leadId.toString()) {
                    // Only revert if we are actually cancelling a move (status is currently destinationId)
                    // If we are in 'quickAction' (phones), sourceId and current status might match so no harm done.
                    return { ...l, status: moveModal.sourceId };
                }
                return l;
            }));
        }
        setMoveModal({ ...moveModal, isOpen: false });
    };

    const handleDragEnd = async (result) => {
        console.log('handleDragEnd RESULT:', result);
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const destId = destination.droppableId;
        const sourceId = source.droppableId;

        // Custom Logic: Confirm Re-opening
        if ((sourceId === 'won' || sourceId === 'closed') && destId !== sourceId) {
            const confirmReopen = window.confirm("Você está movendo um lead finalizado. Deseja reabrir este lead?");
            if (!confirmReopen) return;
        }


        // Optimistic Update can cause 'freeze' if not handled well with React 18 concurrency
        // We will move state update to AFTER modal is set to avoid re-render race conditions in slow environments

        if (['connecting', 'connected', 'scheduled', 'negotiation', 'closed'].includes(destId)) {
            // Calculate Next Attempt properly using Business Logic
            const nextAttempt = calculateNextAttempt(new Date());

            // Open modal immediately - don't wait for animation
            setMoveModal({
                isOpen: true,
                leadId: draggableId,
                destinationId: destId,
                sourceId: source.droppableId,
                data: {}
            });

            setMoveData({
                notes: '',
                proposedValue: '',
                appointmentDate: '',
                outcome: 'success',
                scheduledMeeting: 'no',
                nextTaskDate: new Date(nextAttempt.date.getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
            });

            return;
        }

        // Special handling for "won" status - Open enrollment modal
        if (destId === 'won') {
            const lead = leads.find(l => l.id.toString() === draggableId.toString());
            if (lead) {
                // First execute the move to update status
                await executeMove(draggableId, destId);

                // Then open enrollment modal
                setEnrollmentModal({ isOpen: true, lead });
            }
            return;
        }

        executeMove(draggableId, destination.droppableId);
    };

    const handleQuickAction = (leadOrId, outcome = 'success', destinationStage = 'connecting') => {
        // Support both lead object and leadId
        const leadId = typeof leadOrId === 'object' ? leadOrId.id : leadOrId;
        const leadData = typeof leadOrId === 'object' ? leadOrId : leads.find(l => l.id === leadOrId);
        const sourceStatus = leadData?.status || 'new';

        // Custom Flow for Scheduled/Negotiation Leads confirmation
        // If coming from 'scheduled', we always want to verify attendance
        const isAttendanceCheck = sourceStatus === 'scheduled' || (sourceStatus === 'negotiation' && destinationStage === 'negotiation');

        // Determine destination based on check, or default
        const initialDestination = isAttendanceCheck ? (sourceStatus === 'scheduled' ? 'negotiation' : destinationStage) : destinationStage;

        setMoveModal({
            isOpen: true,
            leadId: leadId,
            destinationId: initialDestination,
            sourceId: sourceStatus,
            data: leadData || {},
            step: isAttendanceCheck ? 'attendance_check' : 'details' // New Step
        });

        const nextAttempt = calculateNextAttempt(new Date());

        setMoveData({
            notes: '',
            proposedValue: '',
            appointmentDate: '',
            appointmentType: 'Presencial',
            outcome: outcome,
            scheduledMeeting: 'no',
            nextTaskDate: new Date(nextAttempt.date.getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
        });
    };

    // Expose globally for LeadDetailsModal
    useEffect(() => {
        window.handleQuickActionFromModal = handleQuickAction;
        return () => {
            delete window.handleQuickActionFromModal;
        };
    }, [leads]);


    const handleBulkTransfer = async () => {
        console.log('handleBulkTransfer called', { selectedLeads, transferTargetId });
        if (!selectedLeads.length || !transferTargetId) {
            console.warn('Missing data:', { selectedLeads: selectedLeads.length, transferTargetId });
            return;
        }

        if (!window.confirm('Tem certeza que deseja transferir ' + selectedLeads.length + ' leads?')) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            // Parallelize requests or use bulk endpoint if available. For safety, parallel requests.
            const promises = selectedLeads.map(id =>
                fetch(API_URL + '/crm/leads/' + id, { // Note: Transfer logic usually uses PUT, verify endpoint
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ responsibleId: transferTargetId })
                })
            );

            await Promise.all(promises);

            alert('Transferência concluída com sucesso!');
            setShowTransferModal(false);
            setSelectedLeads([]);
            fetchLeads();

        } catch (error) {
            console.error('Erro na transferência em massa', error);
            alert('Erro ao transferir alguns leads.');
        } finally {
            setIsSaving(false);
        }
    };

    // Undo UI State
    const [undoState, setUndoState] = useState({ show: false, leads: [], timer: null });

    // Load Undo State from Persistent Storage (Global Recovery)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('undo_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                const elapsed = Date.now() - parsed.timestamp;
                const remaining = (10 * 60 * 1000) - elapsed;

                if (remaining > 0) {
                    console.log(`♻️ Recovered Undo State: ${parsed.leads.length} leads, ${Math.round(remaining / 1000)}s remaining`);
                    setUndoState({
                        show: true,
                        leads: parsed.leads,
                        timer: setTimeout(() => {
                            setUndoState(prev => ({ ...prev, show: false }));
                            localStorage.removeItem('undo_state');
                        }, remaining)
                    });
                } else {
                    localStorage.removeItem('undo_state');
                }
            }
        } catch (e) {
            console.error('Failed to load undo state:', e);
        }
    }, []);

    const handleBulkDelete = async () => {
        if (!selectedLeads.length) return;

        // Optimistic UI Removal
        const leadsToRemove = [...selectedLeads];
        setLeads(prev => prev.filter(l => !leadsToRemove.includes(l.id)));
        setAllLeads(prev => prev.filter(l => !leadsToRemove.includes(l.id)));
        setSelectedLeads([]);
        setIsDeleteModalOpen(false); // Close confirmation if open

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL + '/crm/leads/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ leadIds: leadsToRemove })
            });

            if (!res.ok) throw new Error('Falha na exclusão');

            // Show Undo Option (Persistent)
            if (undoState.timer) clearTimeout(undoState.timer);

            const timeoutMs = 10 * 60 * 1000;
            const timer = setTimeout(() => {
                setUndoState(prev => ({ ...prev, show: false }));
                localStorage.removeItem('undo_state');
            }, timeoutMs);

            const newState = {
                show: true,
                leads: leadsToRemove,
                timer: timer
            };
            setUndoState(newState);

            // Persist State for Global Recovery
            localStorage.setItem('undo_state', JSON.stringify({
                leads: leadsToRemove,
                timestamp: Date.now()
            }));

        } catch (error) {
            console.error('Delete error', error);
            alert('Erro ao excluir leads. Recarregando...');
            fetchLeads();
        }
    };

    const handleUndoDelete = async () => {
        if (!undoState.leads.length) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL + '/crm/leads/undo-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ leadIds: undoState.leads })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Falha ao restaurar leads');
            }

            // Restore UI
            if (undoState.timer) clearTimeout(undoState.timer);
            setUndoState({ show: false, leads: [], timer: null });
            localStorage.removeItem('undo_state');
            fetchLeads(); // Refetch to get data back
        } catch (error) {
            console.error('❌ Undo Delete Error:', error);
            alert(`Erro ao desfazer exclusão: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const executeMove = async (leadId, status, extraData = {}) => {
        // Optimistic UI update
        const updatedLeads = leads.map(lead => {
            if (lead.id.toString() === leadId.toString()) {
                return { ...lead, status, ...extraData };
            }
            return lead;
        });
        setLeads(updatedLeads);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(API_URL + '/crm/leads/' + leadId + '/move', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ status, ...extraData })
            });

            if (res.ok) {
                const updatedLeadPayload = await res.json();
                setLeads(prevLeads => prevLeads.map(l =>
                    l.id.toString() === leadId.toString() ? updatedLeadPayload : l
                ));
                // Update Selected Lead for Real-Time Modal Refresh
                if (selectedLead && String(selectedLead.id) === String(leadId)) {
                    setSelectedLead(updatedLeadPayload);
                }
                setHighlightedLeadId(Number(leadId)); // Trigger Highlight on Move
            } else {
                fetchLeads();
            }
        } catch (error) {
            console.error('Error moving lead', error);
            fetchLeads();
        }
    };

    const confirmMove = () => {
        const { destinationId, leadId } = moveModal;
        let finalStatus = destinationId;
        let finalData = { ...moveData };



        // SMART FLOW LOGIC
        if (destinationId === 'connecting') {
            if (moveData.outcome === 'failure') {
                // Return to 'new' stage or keep in 'connecting'? 
                // Context asks for a task for 4h later. 
                // We'll keep it in 'connecting' with the task.
                finalStatus = 'connecting';

                // User must provide date
                if (!moveData.nextTaskDate) {
                    alert('Por favor, defina a data e horário da próxima tarefa/tentativa.');
                    return;
                }
                const nextTaskDateToUse = new Date(moveData.nextTaskDate);

                // Check for max attempts (5)
                const leadsList = leads || []; // Safety check
                const leadRef = leadsList.find(l => l.id.toString() === leadId.toString());

                // Calculate based on attempts array length for accuracy
                let currentAttemptsList = [];
                if (leadRef && leadRef.attempts) {
                    try {
                        currentAttemptsList = typeof leadRef.attempts === 'string' ? JSON.parse(leadRef.attempts) : leadRef.attempts;
                    } catch (e) {
                        currentAttemptsList = [];
                    }
                }

                // Filter out placeholder/empty attempts created by legacy bugs
                const validAttempts = Array.isArray(currentAttemptsList) ? currentAttemptsList.filter(a => a.date && a.date !== '') : [];
                const failCount = validAttempts.length + 1; // +1 for this failure

                if (failCount >= 5) {
                    finalStatus = 'closed';
                    finalData.notes = 'Encerrado automaticamente aos 5 tentativas sem sucesso. Última: ' + (moveData.notes || 'Sem observação');
                    finalData.archived = true;
                    // Clear next task
                    finalData.nextTaskDate = null;
                    finalData.nextTaskType = null;
                } else {
                    finalData.nextTaskDate = nextTaskDateToUse.toISOString();
                    finalData.nextTaskType = 'Nova Tentativa';
                    const formattedDate = nextTaskDateToUse.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    finalData.notes = 'Falha no contato (' + (failCount) + '/5). Próxima tentativa agendada para ' + (formattedDate) + '. ' + (moveData.notes || 'Sem observação');
                    // Send increment instruction to backend
                    finalData.incrementAttempts = true;
                }
            } else {
                // Success path
                if (moveData.scheduledMeeting === 'yes') {
                    if (!moveData.appointmentDate) return alert('Selecione a data/hora do agendamento.');
                    finalStatus = 'scheduled';
                } else {
                    finalStatus = 'connected';
                    // If user set a next task date manually (optional)
                    if (moveData.nextTaskDate) {
                        finalData.nextTaskDate = new Date(moveData.nextTaskDate).toISOString();
                        finalData.nextTaskType = 'Retorno Agendado (Conexão)';
                    }
                }
            }
        }

        // NEGOTIATION LOGIC
        if (destinationId === 'negotiation') {
            if (moveData.outcome === 'success') {
                if (moveData.scheduledMeeting === 'yes') {
                    if (!moveData.appointmentDate) {
                        alert('Por favor, informe a data da matrícula.');
                        return;
                    }
                    finalStatus = 'won';
                    finalData.notes = `Matrícula realizada! ${moveData.notes || ''}`.trim();
                } else {
                    finalStatus = 'negotiation';
                    if (moveData.nextTaskDate) {
                        finalData.nextTaskDate = new Date(moveData.nextTaskDate).toISOString();
                        finalData.nextTaskType = 'Follow-up Negociação';
                    }
                }
            } else if (moveData.outcome === 'failure') {
                if (!moveData.nextTaskDate) {
                    alert('Por favor, defina a data e horário da próxima tentativa.');
                    return;
                }
                const leadsList = leads || [];
                const leadRef = leadsList.find(l => l.id.toString() === leadId.toString());
                let negotiationAttempts = [];
                if (leadRef && leadRef.negotiationAttempts) {
                    try {
                        negotiationAttempts = typeof leadRef.negotiationAttempts === 'string' ? JSON.parse(leadRef.negotiationAttempts) : leadRef.negotiationAttempts;
                    } catch (e) { negotiationAttempts = []; }
                }
                const validAttempts = Array.isArray(negotiationAttempts) ? negotiationAttempts.filter(a => a.date && a.date !== '') : [];
                const attemptCount = validAttempts.length + 1;
                if (attemptCount >= 5) {
                    finalStatus = 'closed';
                    finalData.notes = `Encerrado automaticamente após 5 tentativas de negociação sem sucesso. Última: ${moveData.notes || 'Sem observação'}`;
                    finalData.archived = true;
                    finalData.nextTaskDate = null;
                    finalData.nextTaskType = null;
                } else {
                    finalStatus = 'negotiation';
                    const nextTaskDateToUse = new Date(moveData.nextTaskDate);
                    finalData.nextTaskDate = nextTaskDateToUse.toISOString();
                    finalData.nextTaskType = 'Retentativa Negociação';
                    const formattedDate = nextTaskDateToUse.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                    finalData.notes = `Tentativa de negociação (${attemptCount}/5). Próxima tentativa: ${formattedDate}. ${moveData.notes || ''}`.trim();
                    finalData.incrementNegotiationAttempts = true;
                }
            }
        }

        if (finalStatus === 'negotiation' && !moveData.proposedValue) {
            alert('Por favor, informe o Valor Proposto.');
            return;
        }
        if (finalStatus === 'scheduled' && !moveData.appointmentDate) {
            alert('Por favor, selecione a Data e Hora do Agendamento.');
            return;
        }

        if (finalStatus === 'no_show' && !moveData.nextTaskDate) {
            alert('Por favor, selecione a Data para a Nova Tentativa (No-Show).');
            return;
        }

        // Ensure notes has fallback if empty
        if (!finalData.notes) finalData.notes = 'Sem observação';

        executeMove(leadId, finalStatus, finalData);
        setMoveModal({ ...moveModal, isOpen: false });
    };

    const handleOpenNewLead = () => {
        const currentUnitName = user.unit?.name || user.unitName || user.unit || 'Minha Unidade';

        setNewLead({
            ...getInitialLeadState(),
            unitId: user.unitId,
            unit: typeof currentUnitName === 'string' ? currentUnitName : 'Minha Unidade',
            responsible: user.name || user.email || 'Eu',
            responsibleId: user.id,
        });
        setFormStep(1);
        setSelectedLead(null);
        setShowNewLeadModal(true);
    };

    const handleOpenEditLead = (lead) => {
        setHighlightedLeadId(null); // Clear highlight on interaction
        setSelectedLead(lead);
        setNewLead({
            title: lead.title || '',
            value: lead.value ? lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
            name: lead.contact?.name || lead.name || '',
            phone: formatPhone(lead.contact?.phone || lead.phone || ''),
            email: lead.contact?.email || lead.email || '',
            company: lead.company || '',
            city: lead.city || '',
            neighborhood: lead.neighborhood || '',
            source: lead.source || 'Instagram',
            campaign: lead.campaign || '',
            tags: Array.isArray(lead.tags) ? lead.tags.join(', ') : (lead.tags || ''),
            unitId: lead.unitId || user.unitId,
            unit: lead.unit || lead.Unit?.name || user.unit?.name || user.unit || 'Unidade Atual',
            responsible: lead.responsible || lead.responsibleId || user.name,
            responsibleId: lead.consultant_id || lead.responsibleId || user.id,
            status: lead.status || 'new',
            attempts: lead.attempts ? (typeof lead.attempts === 'string' ? JSON.parse(lead.attempts) : lead.attempts) : [],
            nextTaskDate: lead.nextTaskDate ? new Date(new Date(lead.nextTaskDate).getTime() - (new Date(lead.nextTaskDate).getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : '',
            nextTaskType: lead.nextTaskType || 'Nova Tentativa',
            observation: lead.observation || lead.notes || '',
            contactSummary: lead.contactSummary || ''
        });
        setFormStep(1);
        setShowNewLeadModal(true);
    };

    const handleDeleteLead = async () => {
        setIsDeleteModalOpen(true);
    };



    const confirmDelete = async () => {
        if (!selectedLead) return;
        setIsSaving(true);
        try {
            await api.delete('/crm/leads/' + (selectedLead.id));
            alert('Lead excluído com sucesso!');
            setIsDeleteModalOpen(false);
            setShowNewLeadModal(false);
            fetchLeads(); // Refresh list from server
        } catch (error) {
            console.error('Erro ao excluir lead:', error);
            alert('Erro ao excluir lead. Tente novamente.');
        } finally {
            setIsSaving(false);
        }
    };

    const [lastImportId, setLastImportId] = useState(null);

    const handleUndoImport = async (confirmed) => {
        if (!confirmed) {
            setLastImportId(null);
            return;
        }

        if (!lastImportId) return;
        // const confirmUndo = window.confirm('Tem certeza que deseja desfazer a última importação? Isso excluirá todos os leads criados.');
        // if (!confirmUndo) return;

        setIsSaving(true);
        try {
            await api.post(`/crm/leads/import/undo/${lastImportId}`);
            alert('Importação desfeita com sucesso!');
            setLastImportId(null);
            fetchLeads();
        } catch (error) {
            console.error('Erro ao desfazer:', error);
            alert('Erro ao desfazer importação.');
        } finally {
            setIsSaving(false);
        }
    };



    const handleImportLeads = async (newLeads, duplicateAction, unitId, ownerMap) => {
        if (!newLeads || newLeads.length === 0) return;

        setIsSaving(true);
        try {
            const importId = 'imp_' + (Date.now());
            const BATCH_SIZE = 100; // Can be larger for bulk endpoint

            // To prevent massive payloads, we might still batch if needed, but 'bulk' endpoint expects one call per transaction usually.
            // If list is huge (1000+), splitting transactions might be safer but 'Undo' becomes harder (multiple Import IDs).
            // For now, let's assume reasonable size (up to 500) and send at once.

            const payload = {
                leads: newLeads.map(l => {
                    // Strip temp ID
                    const { id, ...rest } = l;
                    return rest;
                }),
                duplicateAction, // 'overwrite' | 'ignore'
                unitId,
                importId,
                ownerMap
            };

            const response = await api.post('/crm/leads/import/bulk', payload);

            if (response && response.importId) {
                setLastImportId(response.importId);
            }

            // Show Success + Undo Option
            // Since we use standard alert, we can't show a button easily inside it.
            // We'll set state to show a "Undo UI" or just alert.
            // Requirement says "create a function to undo".

            const errorMsg = response.errors && response.errors.length > 0 ? '\n\nErros (' + response.errors.length + '):\n' + response.errors.slice(0, 5).join('\n') : '';
            alert('Processo finalizado!\nCriados: ' + (response.created || 0) + '\nAtualizados: ' + (response.updated || 0) + '\nIgnorados: ' + (response.ignored || 0) + errorMsg);

            fetchLeads(); // Refresh board
        } catch (error) {
            console.error('Erro na importação:', error);
            alert('Ocorreu um erro durante a importação: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateLead = async (submittedData) => {
        if (isSaving) return;
        const leadData = submittedData && typeof submittedData === 'object' ? submittedData : newLead;

        // Step 1 Check
        if (!leadData.name || !leadData.phone || (!leadData.source && !leadData.origin)) {
            // Allow origin or source
        }
        // Minimal Validation for now as LeadDetailsModal handles most input
        if (!leadData.name) {
            alert('Por favor, informe o Nome.');
            return;
        }

        // Enrollment Check (if status is 'won')
        if (leadData.status === 'won') {
            const missing = [];
            if (!leadData.email) missing.push('Email');
            if (!leadData.value || parseFloat(leadData.value) <= 0) missing.push('Valor da Matrícula');
            if (!leadData.responsibleId) missing.push('Responsável');

            if (missing.length > 0) {
                alert('Para realizar a matrícula, os seguintes campos são obrigatórios: ' + (missing.join(', ')));
                return;
            }
        }

        let leadTitle = leadData.title;
        if (!leadTitle || !leadTitle.trim()) {
            leadTitle = 'Negócio - ' + (leadData.name);
        }

        const leadPayload = {
            ...leadData,
            unitId: Number(leadData.unitId || user.unitId),
            value: typeof leadData.sales_value === 'string' ? parseFloat(leadData.sales_value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) : (leadData.value || 0),
            sales_value: typeof leadData.sales_value === 'string' ? parseFloat(leadData.sales_value.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) : (leadData.value || 0),
            title: leadTitle,
            tags: typeof leadData.tags === 'string' ? leadData.tags.split(',').map(t => t.trim()).filter(t => t) : leadData.tags,
            responsibleId: Number(leadData.responsibleId || leadData.consultant_id || user.id),
        };

        // Auto-schedule task for Immediate Attention if new lead
        if (!selectedLead && !leadPayload.nextTaskDate) {
            leadPayload.nextTaskDate = new Date();
            if (!leadPayload.nextTaskType) leadPayload.nextTaskType = 'Primeiro Contato';
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = selectedLead
                ? (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/crm/leads/' + (selectedLead.id)
                : (import.meta.env.VITE_API_URL || 'http://localhost:3000/api') + '/crm/leads';
            const method = selectedLead ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(leadPayload)
            });

            if (!res.ok) throw new Error('Falha ao salvar lead');
            const savedData = await res.json();

            // Re-map fields for immediate UI update
            const savedLead = {
                ...savedData,
                unit: savedData.unit || leadData.unit,
                responsible: savedData.responsible || leadData.responsible
            };

            if (selectedLead) {
                setLeads(prev => prev.map(l => String(l.id) === String(selectedLead.id) ? savedLead : l));
            } else {
                setLeads(prev => [savedLead, ...prev]);
            }
            setShowNewLeadModal(false);
            // Highlight Logic
            setHighlightedLeadId(savedLead.id);
            // Reset form if success
            setSelectedLead(null);
            if (!selectedLead) setNewLead(getInitialLeadState());
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar lead.');
        } finally {
            setIsSaving(false);
        }
    };

    const downloadTemplate = () => {
        const headers = ["Nome", "Telefone", "Email", "Titulo", "Valor", "Empresa", "Cidade", "Bairro", "Origem", "Tags", "Unidade", "Responsavel", "Observacoes"];
        const row = {
            "Nome": "João Silva",
            "Telefone": "5511999999999",
            "Email": "joao@email.com",
            "Titulo": "Negociacao João",
            "Valor": 1500.00,
            "Empresa": "Empresa X",
            "Cidade": "São Paulo",
            "Bairro": "Centro",
            "Origem": "Instagram",
            "Tags": "Importado, Verão",
            "Unidade": "Matriz",
            "Responsavel": "Nome do Consultor",
            "Observacoes": "Cliente interessado em curso"
        };

        const ws = XLSX.utils.json_to_sheet([row], { header: headers });

        // Adjust Column Widths
        const wscols = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Modelo Leads");
        XLSX.writeFile(wb, "modelo_leads_completo.xlsx");
    };

    // Fetch Units for Global Users
    useEffect(() => {
        if (user && GLOBAL_VIEW_ROLES.includes(Number(user.roleId))) {
            const fetchUnits = async () => {
                try {
                    const res = await fetch(`${API_URL}/units`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    if (res.ok) setUnits(await res.json());
                } catch (e) { console.error(e); }
            };
            fetchUnits();
        }
    }, [user]);

    const handleDashboardFilterChange = (filters) => {
        // Merge partial updates from DashboardFilters
        const nextFilters = {
            ...activeFilters,
            unitId: filters.unitId,
            startDate: filters.startDate,
            endDate: filters.endDate,
            period: filters.period
        };
        setActiveFilters(nextFilters);
        // Trigger fetch immediately
        fetchLeads(nextFilters);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', height: '100%', overflow: 'hidden' }}>

            {/* Header Actions iOS Style */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.05)', padding: '4px', borderRadius: '14px', width: 'fit-content' }}>
                        <button onClick={() => setActiveTab('crm')} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', background: activeTab === 'crm' ? '#fff' : 'transparent', color: activeTab === 'crm' ? '#000' : '#666', boxShadow: activeTab === 'crm' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                            Comercial
                        </button>

                    </div>
                </div>

                {/* Search Bar (Importado Style) */}
                <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Pesquisar..."
                        value={activeFilters.name || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            const newFilters = { ...activeFilters, name: val };
                            setActiveFilters(newFilters);
                            // Debounce fetching if possible, or just fetch
                            // For now, simple immediate update (might need debounce in real app)
                            // But to match current logic:
                            if (val.length > 2 || val.length === 0) fetchLeads(newFilters);
                        }}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px',
                            outline: 'none',
                            background: '#f8fafc',
                            transition: 'all 0.2s'
                        }}
                        onFocus={(e) => e.target.style.background = '#fff'}
                        onBlur={(e) => e.target.style.background = '#f8fafc'}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0, minWidth: 'fit-content' }}>

                    {/* View Toggle */}
                    <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '99px', padding: '4px', display: 'flex', gap: '4px' }}>
                        <button onClick={() => setViewMode('board')} style={{ padding: '8px', borderRadius: '99px', border: 'none', background: viewMode === 'board' ? '#fff' : 'transparent', color: viewMode === 'board' ? '#000' : '#8E8E93', cursor: 'pointer', boxShadow: viewMode === 'board' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
                            <LayoutGrid size={18} />
                        </button>
                        <button onClick={() => setViewMode('list')} style={{ padding: '8px', borderRadius: '99px', border: 'none', background: viewMode === 'list' ? '#fff' : 'transparent', color: viewMode === 'list' ? '#000' : '#8E8E93', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', transition: '0.2s' }}>
                            <LayoutList size={18} />
                        </button>
                    </div>

                    {/* Common Filters */}
                    <button
                        onClick={() => setShowFilterModal(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '0 24px', height: '46px', borderRadius: '99px', background: 'rgba(0,0,0,0.05)', boxSizing: 'border-box', border: 'none', fontWeight: '900', fontSize: '14px', color: '#1C1C1E', cursor: 'pointer'
                        }}
                    >
                        <Filter size={18} color="#1C1C1E" />
                        Filtrar
                        {Object.entries(activeFilters).filter(([k, v]) => {
                            if (v === 'all' || v === '') return false;
                            if (k === 'period') return false;
                            if (k === 'unitId') return false;
                            return true;
                        }).length > 0 && (
                                <span style={{ background: 'var(--ios-teal)', color: 'white', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {Object.entries(activeFilters).filter(([k, v]) => {
                                        if (v === 'all' || v === '') return false;
                                        if (k === 'period') return false;
                                        if (k === 'unitId') return false;
                                        return true;
                                    }).length}
                                </span>
                            )}
                    </button>
                    <button onClick={handleOpenNewLead} className="btn-primary">
                        <Plus size={18} /> Novo Lead
                    </button>

                    {/* Settings Button */}
                    <div style={{ position: 'relative' }} ref={settingsRef}>
                        <button
                            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                            style={{
                                width: '46px', height: '46px', borderRadius: '50%', border: 'none', background: showSettingsMenu ? '#000' : 'rgba(0,0,0,0.05)', color: showSettingsMenu ? '#fff' : '#1C1C1E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s'
                            }}
                        >
                            <Settings size={20} />
                        </button>

                        {showSettingsMenu && (
                            <div style={{
                                position: 'absolute', top: '56px', right: 0, width: '240px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden', zIndex: 50, border: '1px solid rgba(0,0,0,0.05)', padding: '8px'
                            }}>
                                <h4 style={{ margin: '8px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#8E8E93', fontWeight: '800' }}>Ferramentas</h4>



                                <button onClick={() => { setViewMode('list'); setShowSettingsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#1C1C1E', borderRadius: '8px', textAlign: 'left' }} className="hover:bg-gray-100">
                                    <ArrowLeftRight size={16} /> Transferência em Massa
                                </button>

                                <div style={{ height: '1px', background: '#f5f5f5', margin: '4px 0' }}></div>

                                <button onClick={() => { setShowImportModal(true); setShowSettingsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#1C1C1E', borderRadius: '8px', textAlign: 'left' }} className="hover:bg-gray-100">
                                    <Upload size={16} /> Importar Leads
                                </button>
                                <button onClick={() => { downloadTemplate(); setShowSettingsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', fontSize: '14px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#1C1C1E', borderRadius: '8px', textAlign: 'left' }} className="hover:bg-gray-100">
                                    <Download size={16} /> Modelo Excel
                                </button>

                                {lastImportId && (
                                    <button onClick={() => { handleUndoImport(true); setShowSettingsMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 12px', fontSize: '14px', border: 'none', background: '#FEF2F2', cursor: 'pointer', color: '#DC2626', borderRadius: '8px', marginTop: '4px', textAlign: 'left', fontWeight: '600' }} className="hover:bg-red-100">
                                        <Trash2 size={16} /> Desfazer Importação
                                    </button>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Dashboard Filters Integration */}

            {/* Importado Top Stats */}
            {activeTab === 'crm' && (
                <div style={{ padding: '0 24px 10px', display: 'flex', justifyContent: 'space-between', color: '#687b8c', fontSize: '11px', fontWeight: '500' }}>
                    <div style={{ display: 'flex', gap: '40px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div>Com tarefas para hoje:</div>
                            <div style={{ color: '#22c55e', fontWeight: 'bold', fontSize: '16px' }}>{stats.todayCount}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div>Sem tarefas atribuídas:</div>
                            <div style={{ color: '#eab308', fontWeight: 'bold', fontSize: '16px' }}>{stats.noTaskCount}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div>Com tarefas atrasadas:</div>
                            <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '16px' }}>{stats.overdueCount}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div>Novo hoje:</div>
                            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{stats.newTodayCount}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div>Vendas em potencial</div>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{stats.totalLeads} leads: {stats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                </div>
            )}

            {/* Dashboard Filters Removed per Request */}

            {/* CRM Content */}
            {
                (activeTab === 'crm') && (
                    viewMode === 'list' ? (
                        <div style={{ flex: 1, padding: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>Todos os Leads</h3>
                                    {selectedLeads.length > 0 && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#F0F9FF', padding: '8px 16px', borderRadius: '8px', color: '#0369A1' }}>
                                            <span style={{ fontWeight: '700', fontSize: '13px' }}>{selectedLeads.length} selecionados</span>
                                            {/* Action Buttons */}
                                            {/* Transfer: Global (1,10) + Gestão (20,30) + Líder (40 - Opcional, por enquanto restrito) */}
                                            {GLOBAL_VIEW_ROLES.includes(Number(user?.roleId)) && (
                                                <button
                                                    onClick={() => setShowTransferModal(true)}
                                                    style={{ border: 'none', background: '#0284C7', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <ArrowLeftRight size={14} /> Transferir
                                                </button>
                                            )}

                                            {/* Delete: STRICTLY Global (1,10) + Gestão (20,30) */}
                                            {[1, 10, 20, 30].includes(Number(user?.roleId)) && (
                                                <button
                                                    onClick={handleBulkDelete}
                                                    style={{ border: 'none', background: '#DC2626', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Trash2 size={14} /> Excluir
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                                            <tr>
                                                <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>
                                                    <input
                                                        type="checkbox"
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                // Select all visible
                                                                const allVisible = activeTab === 'all' ? leads : columnOrder.flatMap(colId => getLeadsByStatus(colId));
                                                                const allIds = allVisible.map(l => l.id);
                                                                setSelectedLeads(allIds);
                                                            } else {
                                                                setSelectedLeads([]);
                                                            }
                                                        }}
                                                        checked={selectedLeads.length > 0 && selectedLeads.length === (activeTab === 'all' ? leads.length : columnOrder.flatMap(colId => getLeadsByStatus(colId)).length)}
                                                    />
                                                </th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Nome</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Telefone Principal</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Status/Etapa</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Responsável</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '700', color: '#64748b' }}>Última Interação</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: '#64748b' }}>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(activeTab === 'all' ? leads : columnOrder.flatMap(colId => getLeadsByStatus(colId))).map(lead => (
                                                <tr key={lead.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="hover:bg-slate-50">
                                                    <td style={{ padding: '12px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedLeads.includes(lead.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedLeads([...selectedLeads, lead.id]);
                                                                else setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                                                            }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{lead.name}</div>
                                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{lead.email}</div>
                                                    </td>
                                                    <td style={{ padding: '12px', color: '#475569' }}>{formatPhone(lead.phone || lead.mobile || lead.whatsapp || lead['celular__contato_'] || '')}</td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            background: (columns[lead.status]?.color || '#ccc') + '20',
                                                            color: columns[lead.status]?.color || '#666',
                                                            padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase'
                                                        }}>
                                                            {columns[lead.status]?.title || lead.status}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', color: '#475569' }}>
                                                        {lead.responsible || 'Sem Dono'}
                                                    </td>
                                                    <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                                                        {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString('pt-BR') : '-'}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleOpenEditLead(lead)}
                                                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6', fontWeight: '600', fontSize: '12px' }}
                                                        >
                                                            Editar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {columnOrder.flatMap(colId => getLeadsByStatus(colId)).length === 0 && (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                                        Nenhum lead encontrado com os filtros atuais.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
                            <div style={{
                                display: 'flex', gap: '1px', overflowX: 'auto', paddingBottom: '16px',
                                flex: 1, paddingRight: '20px'
                            }}>
                                {columnOrder.map((colId, index) => {
                                    const column = columns[colId];
                                    const colLeads = getLeadsByStatus(colId);

                                    return (
                                        <div key={colId} style={{
                                            minWidth: '260px',
                                            maxWidth: '260px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: 'calc(100vh - 280px)',
                                            maxHeight: '100%',
                                            background: 'transparent',
                                            marginLeft: '1px',
                                        }}>
                                            {/* Importado Header Style */}
                                            <div style={{
                                                background: 'white',
                                                padding: '12px 14px',
                                                borderBottom: `3px solid ${column.color}`,
                                                borderRadius: '4px 4px 0 0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                marginBottom: '8px'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#404040' }}>
                                                        {column.title}
                                                    </span>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: column.color }} />
                                                </div>
                                                <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>
                                                    {colLeads.length} leads: <span style={{ color: '#333', fontWeight: '600' }}>{colLeads.reduce((sum, l) => sum + (Number(l.sales_value) || Number(l.value) || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                                </span>
                                            </div>

                                            {/* Quick Add Button in First Column */}
                                            {index === 0 && (
                                                <button
                                                    onClick={() => setShowQuickAddModal(true)}
                                                    style={{
                                                        width: '100%', padding: '10px', background: '#F9FAFB', border: '1px dashed #D1D5DB',
                                                        borderRadius: '4px', textAlign: 'center', fontSize: '12px', color: '#6B7280', marginBottom: '8px', cursor: 'pointer',
                                                        fontWeight: '600'
                                                    }}
                                                    className="hover:bg-gray-100 transition-colors"
                                                >
                                                    + Adição rápida
                                                </button>
                                            )}


                                            <div
                                                className="custom-scrollbar"
                                                style={{
                                                    flex: 1,
                                                    minHeight: '150px',
                                                    overflowY: 'auto',
                                                    padding: '8px 0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '1px'
                                                }}
                                            >
                                                {colLeads.map((lead, index) => (
                                                    <KanbanCard
                                                        key={lead.id}
                                                        lead={lead}
                                                        index={index}
                                                        statusColor={column.color}
                                                        onClick={() => handleOpenEditLead(lead)}
                                                        onQuickAction={handleQuickAction}
                                                        isHighlighted={lead.id === highlightedLeadId}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                )
            }

            {/* Move Funnel Modal - Inline version without createPortal */}
            {
                moveModal.isOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: '20px'
                    }}>
                        <div style={{
                            background: '#fff',
                            borderRadius: '32px',
                            width: '100%',
                            maxWidth: '450px',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.4)'
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '24px 24px 16px',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                                    Mover para {columns[moveModal.destinationId]?.title}
                                </h3>
                                <button
                                    onClick={handleCloseMoveModal}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '24px'
                            }}>
                                {/* ATTENDANCE CHECK STEP */}
                                {moveModal.step === 'attendance_check' ? (
                                    <div className="animate-fade-in">
                                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937', textAlign: 'center' }}>
                                            Confirmação de Agendamento
                                        </h4>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {/* Question 1: Showed Up? */}
                                            <div>
                                                <label style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '12px', display: 'block', textAlign: 'center' }}>
                                                    O lead compareceu ao agendamento?
                                                </label>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button
                                                        onClick={() => {
                                                            // No Show -> Move directly to No-Show logic
                                                            setMoveModal(prev => ({
                                                                ...prev,
                                                                destinationId: 'no_show',
                                                                step: 'details' // Go to details to capture next attempt
                                                            }));
                                                            setMoveData(prev => ({ ...prev, outcome: 'failure' })); // Default to failure/reschedule logic
                                                        }}
                                                        style={{
                                                            flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #fee2e2',
                                                            background: '#fef2f2', color: '#dc2626', fontWeight: 'bold', cursor: 'pointer',
                                                            transition: 'transform 0.1s'
                                                        }}
                                                    >
                                                        Não Compareceu
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            // Showed Up -> Ask Enrolled
                                                            setMoveModal(prev => ({ ...prev, attendanceConfirmed: true }));
                                                        }}
                                                        style={{
                                                            flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #dcfce7',
                                                            background: moveModal.attendanceConfirmed ? '#166534' : '#f0fdf4',
                                                            color: moveModal.attendanceConfirmed ? '#fff' : '#16a34a', fontWeight: 'bold', cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            boxShadow: moveModal.attendanceConfirmed ? '0 4px 12px rgba(22, 163, 74, 0.2)' : 'none'
                                                        }}
                                                    >
                                                        Sim, Compareceu
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Question 2: Enrolled? (Only if Showed Up) */}
                                            {moveModal.attendanceConfirmed && (
                                                <div className="animate-fade-in" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
                                                    <label style={{ fontSize: '14px', fontWeight: '600', color: '#4b5563', marginBottom: '12px', display: 'block', textAlign: 'center' }}>
                                                        Matrícula realizada?
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        <button
                                                            onClick={() => {
                                                                // Not Enrolled -> Move to Negotiation
                                                                setMoveModal(prev => ({
                                                                    ...prev,
                                                                    destinationId: 'negotiation',
                                                                    step: 'details'
                                                                }));
                                                            }}
                                                            style={{
                                                                flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                                background: '#fff', color: '#64748b', fontWeight: 'bold', cursor: 'pointer'
                                                            }}
                                                        >
                                                            Não (Negociação)
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                // Enrolled -> Execute Move to Won
                                                                // Since Won usually triggers specific modal, we can execute move then open enrollment logic
                                                                await executeMove(moveModal.leadId, 'won', { notes: 'Compareceu e Matriculou' });
                                                                setMoveModal(prev => ({ ...prev, isOpen: false }));

                                                                // Open Enrollment Modal (Assumed logic exists in executeMove or handleDrag check, but here we explicitly trigger it)
                                                                const lead = leads.find(l => l.id === moveModal.leadId);
                                                                if (lead) setEnrollmentModal({ isOpen: true, lead });
                                                            }}
                                                            style={{
                                                                flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                                                                background: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                                                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                                            }}
                                                        >
                                                            Sim, Matricular!
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <p style={{ opacity: 0.6, fontSize: '14px', lineHeight: '1.5' }}>
                                            {moveModal.destinationId === 'connecting' ? 'Como foi a tentativa de contato? O sistema irá agendar a próxima tarefa automaticamente.' :
                                                'Atualize as informações do lead para prosseguir com a mudança de estágio no funil.'}
                                        </p>

                                        {moveModal.destinationId === 'connecting' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div>
                                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Resultado</label>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button
                                                            onClick={() => setMoveData(prev => ({ ...prev, outcome: 'success' }))}
                                                            style={{
                                                                flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid',
                                                                borderColor: moveData.outcome === 'success' ? 'var(--ios-teal)' : 'rgba(0,0,0,0.1)',
                                                                background: moveData.outcome === 'success' ? 'rgba(48, 176, 199, 0.1)' : '#fff',
                                                                color: moveData.outcome === 'success' ? 'var(--ios-teal)' : '#000',
                                                                fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
                                                            }}
                                                        >
                                                            Sucesso
                                                        </button>
                                                        <button
                                                            onClick={() => setMoveData(prev => ({ ...prev, outcome: 'failure' }))}
                                                            style={{
                                                                flex: 1, padding: '12px', borderRadius: '14px', border: '1px solid',
                                                                borderColor: moveData.outcome === 'failure' ? '#FF3B30' : 'rgba(0,0,0,0.1)',
                                                                background: moveData.outcome === 'failure' ? 'rgba(255, 59, 48, 0.1)' : '#fff',
                                                                color: moveData.outcome === 'failure' ? '#FF3B30' : '#000',
                                                                fontWeight: 'bold', cursor: 'pointer', transition: '0.2s'
                                                            }}
                                                        >
                                                            Insucesso
                                                        </button>
                                                    </div>
                                                </div>

                                                {moveData.outcome === 'success' && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            padding: '12px',
                                                            background: '#f8fafc',
                                                            borderRadius: '8px',
                                                            border: '1px solid #e2e8f0',
                                                            cursor: 'pointer'
                                                        }} onClick={() => setMoveData(prev => ({ ...prev, scheduledMeeting: prev.scheduledMeeting === 'yes' ? 'no' : 'yes' }))}>
                                                            <input
                                                                type="checkbox"
                                                                checked={moveData.scheduledMeeting === 'yes'}
                                                                onChange={() => { }} // Handled by parent div for better UX
                                                                style={{ margin: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                                                            />
                                                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                                                                {moveModal.destinationId === 'negotiation' ? 'Houve matrícula?' : 'Houve agendamento de reunião?'}
                                                            </span>
                                                        </div>

                                                        {moveData.scheduledMeeting === 'yes' && (
                                                            <div className="animate-fade-in" style={{ marginTop: '4px' }}>
                                                                <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>
                                                                    {moveModal.destinationId === 'negotiation' ? 'Data da Matrícula' : 'Data e Hora da Reunião'}
                                                                </label>
                                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={moveData.appointmentDate}
                                                                        onChange={e => setMoveData({ ...moveData, appointmentDate: e.target.value })}
                                                                        className="input-field"
                                                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                                    />
                                                                    <select
                                                                        value={moveData.appointmentType}
                                                                        onChange={e => setMoveData({ ...moveData, appointmentType: e.target.value })}
                                                                        style={{
                                                                            padding: '10px',
                                                                            borderRadius: '8px',
                                                                            border: '1px solid #e5e7eb',
                                                                            fontSize: '13px',
                                                                            background: 'white',
                                                                            fontWeight: '600'
                                                                        }}
                                                                    >
                                                                        <option value="Presencial">Presencial</option>
                                                                        <option value="Online">Online</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div style={{ marginTop: '8px' }}>
                                                            <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Observações</label>
                                                            <textarea
                                                                value={moveData.notes}
                                                                onChange={e => setMoveData({ ...moveData, notes: e.target.value })}
                                                                placeholder="Descreva o que aconteceu..."
                                                                style={{ height: '60px', width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {moveData.outcome === 'failure' && (
                                                    <div style={{ background: '#FFFBEB', padding: '12px', borderRadius: '12px', border: '1px solid #FEF3C7', fontSize: '12px', color: '#92400E' }}>
                                                        <div style={{ marginBottom: '8px' }}>
                                                            <strong>Retentativa Automática</strong> (Padrão: +4h ou dia útil 09:00)
                                                        </div>
                                                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Data e Hora da Próxima Tarefa</label>
                                                        <input
                                                            type="datetime-local"
                                                            className="input-field"
                                                            value={moveData.nextTaskDate}
                                                            onChange={e => setMoveData({ ...moveData, nextTaskDate: e.target.value })}
                                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                        />
                                                    </div>
                                                )}

                                                {moveData.outcome === 'success' && moveData.scheduledMeeting === 'no' && (
                                                    <div style={{ marginTop: '12px' }}>
                                                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Próximo Passo / Tarefa (Opcional)</label>
                                                        <input
                                                            type="datetime-local"
                                                            className="input-field"
                                                            value={moveData.nextTaskDate || ''}
                                                            onChange={e => setMoveData({ ...moveData, nextTaskDate: e.target.value })}
                                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                                                        />
                                                        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Defina uma data se quiser criar uma tarefa de acompanhamento.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(moveModal.destinationId === 'negotiation' || moveModal.destinationId === 'scheduled' || moveModal.destinationId === 'closed' || moveModal.destinationId === 'no_show') && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {moveModal.destinationId === 'negotiation' && (
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Valor Proposto</label>
                                                        <input
                                                            type="text"
                                                            value={moveData.proposedValue}
                                                            onChange={e => setMoveData({ ...moveData, proposedValue: formatCurrency(e.target.value) })}
                                                            placeholder="R$ 0,00"
                                                            className="input-field"
                                                        />
                                                    </div>
                                                )}
                                                {moveModal.destinationId === 'negotiation' && (
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Próximo Contato</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={moveData.nextTaskDate || ''}
                                                            onChange={e => setMoveData({ ...moveData, nextTaskDate: e.target.value })}
                                                            className="input-field"
                                                        />
                                                    </div>
                                                )}
                                                {moveModal.destinationId === 'scheduled' && (
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Data/Hora</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={moveData.appointmentDate}
                                                            onChange={e => setMoveData({ ...moveData, appointmentDate: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                                {moveModal.destinationId === 'no_show' && (
                                                    <div>
                                                        <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Nova Data para Retentativa</label>
                                                        <input
                                                            type="datetime-local"
                                                            value={moveData.nextTaskDate}
                                                            onChange={e => setMoveData({ ...moveData, nextTaskDate: e.target.value })}
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <label style={{ fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Observações</label>
                                                    <textarea
                                                        value={moveData.notes}
                                                        onChange={e => setMoveData({ ...moveData, notes: e.target.value })}
                                                        placeholder="Descreva o que aconteceu..."
                                                        style={{ height: '80px', width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {moveModal.step !== 'attendance_check' && (
                                <div style={{
                                    padding: '16px 24px',
                                    borderTop: '1px solid rgba(0,0,0,0.06)',
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'flex-end'
                                }}>
                                    <button
                                        onClick={handleCloseMoveModal}
                                        style={{
                                            background: '#F2F2F7',
                                            border: 'none',
                                            padding: '12px 24px',
                                            borderRadius: '99px',
                                            fontWeight: '700',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmMove}
                                        className="btn-primary"
                                    >
                                        Confirmar Mudança
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Modal de Filtros Avançados */}
            {
                showFilterModal && (
                    <FilterModal
                        isOpen={showFilterModal}
                        onClose={() => setShowFilterModal(false)}
                        filters={activeFilters}
                        setFilters={setActiveFilters}
                        consultants={consultants}
                        leads={leads}
                        units={units}
                        user={user}
                        globalRole={GLOBAL_VIEW_ROLES.includes(Number(user?.roleId))}
                    />
                )
            }

            {/* New Lead Modal */}
            {/* Import Leads Modal */}
            <ImportLeadsModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImportLeads}
                consultants={consultants}
                user={user}
                units={units}
            />



            {
                showNewLeadModal && (
                    <LeadDetailsModal
                        isOpen={showNewLeadModal}
                        columns={columns}
                        onClose={() => {
                            setShowNewLeadModal(false);
                            setSelectedLead(null);
                            setFormStep(1);
                            setNewLead(getInitialLeadState());
                        }}
                        lead={selectedLead || { ...newLead, id: 0 }}
                        onSave={handleCreateLead}
                        isReadOnly={false}
                        user={user}
                        consultants={consultants}
                        units={units}
                    />
                )
            }

            {/* DELETE MODAL */}
            <VoxModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Excluir Lead"
                width="400px"
                theme="danger"
            >
                <div className="text-center p-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
                        <Trash2 className="text-red-600" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir Lead?</h3>
                    <p className="text-gray-500 mb-6 text-sm">
                        Você está prestes a excluir o lead <strong>{selectedLead?.name || selectedLead?.title}</strong>.
                        <br /><span className="text-red-500 font-semibold text-xs mt-2 block">Todo o histórico de negociação será perdido.</span>
                    </p>

                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="btn-danger"
                        >
                            {isSaving ? 'Excluindo...' : 'Confirmar Exclusão'}
                        </button>
                    </div>
                </div>
            </VoxModal>

            {/* Interaction Smart Modal */}
            {
                interactionModal.isOpen && (
                    <VoxModal
                        isOpen={true}
                        onClose={() => setInteractionModal({ isOpen: false, lead: null })}
                        title="Registrar Interação"
                        width="500px"
                        footer={
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => setInteractionModal({ isOpen: false, lead: null })} style={{ background: '#F2F2F7', border: 'none', padding: '12px 24px', borderRadius: '99px', fontWeight: '700', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button onClick={confirmInteraction} className="btn-primary">
                                    Confirmar
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-6">
                            <p className="text-sm text-gray-500 font-medium">Para salvar essa opção, preencha os campos abaixo.</p>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Confirme a data e hora da conexão
                                </label>
                                <input
                                    type="datetime-local"
                                    className="input-field"
                                    value={interactionData.date}
                                    onChange={e => setInteractionData({ ...interactionData, date: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Selecione o canal da conexão com o lead
                                </label>
                                <select
                                    className="input-field"
                                    value={interactionData.channel}
                                    onChange={e => setInteractionData({ ...interactionData, channel: e.target.value })}
                                >
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Ligação">Ligação</option>
                                    <option value="E-mail">E-mail</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Presencial">Presencial</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Resultado da Conexão
                                </label>
                                <select
                                    className="input-field"
                                    value={interactionData.result}
                                    onChange={e => setInteractionData({ ...interactionData, result: e.target.value })}
                                >
                                    <option value="" disabled>Selecione...</option>
                                    <option value="success_scheduled">Sucesso com Agendamento</option>
                                    <option value="success_no_schedule">Sucesso sem Agendamento</option>
                                    <option value="failure">Insucesso</option>
                                </select>
                            </div>

                            {interactionData.result === 'success_scheduled' && (
                                <div className="form-group animate-fade-in">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        <Calendar size={14} /> Selecione a data e hora da entrevista
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="input-field"
                                        value={interactionData.scheduleDate}
                                        onChange={e => setInteractionData({ ...interactionData, scheduleDate: e.target.value })}
                                    />
                                    <p className="text-xs text-blue-600 mt-2 font-medium">Ao salvar, o lead será movido para "Agendamento".</p>
                                </div>
                            )}

                            {(interactionData.result === 'success_no_schedule' || interactionData.result === 'failure') && (
                                <div className="form-group animate-fade-in">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: '900', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        <Clock size={14} /> Próxima Tentativa (Sugestão: 4h)
                                    </label>
                                    <input
                                        type="datetime-local"
                                        className="input-field"
                                        value={interactionData.nextAttemptDate}
                                        onChange={e => setInteractionData({ ...interactionData, nextAttemptDate: e.target.value })}
                                    />
                                    {interactionData.result === 'success_no_schedule' && <p className="text-xs text-indigo-600 mt-2 font-medium">Ao salvar, o lead será movido para "Conexão".</p>}
                                    {interactionData.result === 'failure' && interactionModal.lead?.status === 'new' && <p className="text-xs text-orange-600 mt-2 font-medium">Ao salvar, o lead será movido para "Conectando".</p>}
                                </div>
                            )}
                        </div>
                    </VoxModal>
                )
            }

            {/* Bulk Transfer Modal */}
            {
                showTransferModal && (
                    <VoxModal
                        isOpen={true}
                        onClose={() => setShowTransferModal(false)}
                        title="Transferência em Massa"
                        width="400px"
                        footer={
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button onClick={() => { setShowTransferModal(false); setTransferTargetId(''); }} style={{ background: '#F2F2F7', border: 'none', padding: '12px 24px', borderRadius: '99px', fontWeight: '700', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button onClick={handleBulkTransfer} className="btn-primary" disabled={!transferTargetId}>
                                    Transferir {selectedLeads.length} Leads
                                </button>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-gray-500">
                                Selecione o usuário destinatário para transferir os <strong>{selectedLeads.length}</strong> leads selecionados.
                            </p>
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Novo Responsável</label>
                                <select
                                    className="input-field"
                                    value={transferTargetId}
                                    onChange={e => setTransferTargetId(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {consultants.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </VoxModal>
                )
            }

            {/* UNDO BAR (GLOBAL PERSISTENT FOOTER) */}
            {
                undoState.show && (
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        width: '100%',
                        background: '#1c1c1e', // Apple Dark Gray
                        color: '#fff',
                        padding: '16px 24px',
                        boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '24px',
                        zIndex: 999999, // Super High
                        animation: 'slideInUp 0.3s ease-out',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#30D158' }}></div>
                            <span style={{ fontWeight: '500', fontSize: '14px', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
                                {undoState.leads.length} leads movidos para a lixeira.
                                <span style={{ opacity: 0.6, marginLeft: '8px' }}>Pode desfazer em 10 min.</span>
                            </span>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button
                                onClick={handleUndoDelete}
                                style={{
                                    background: '#fff',
                                    color: '#000',
                                    border: 'none',
                                    padding: '8px 24px',
                                    borderRadius: '20px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                            >
                                Desfazer Exclusão
                            </button>
                            <button
                                onClick={() => {
                                    setUndoState(prev => ({ ...prev, show: false }));
                                    localStorage.removeItem('undo_state');
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '8px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex'
                                }}
                                title="Fechar"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Enrollment Modal */}
            <EnrollmentModal
                isOpen={enrollmentModal.isOpen}
                onClose={() => setEnrollmentModal({ isOpen: false, lead: null })}
                lead={enrollmentModal.lead}
                onSuccess={(student) => {
                    console.log('Student enrolled:', student);
                    fetchLeads(); // Refresh leads to show updated status
                    setEnrollmentModal({ isOpen: false, lead: null });
                }}
            />

            {/* Quick Add Modal */}
            <QuickAddLeadModal
                isOpen={showQuickAddModal}
                onClose={() => setShowQuickAddModal(false)}
                onSave={(newLead) => {
                    fetchLeads();
                    setShowQuickAddModal(false);
                }}
            />

            {/* WhatsApp Mkt Content */}

        </div >
    );
};

export default CRMBoard;
