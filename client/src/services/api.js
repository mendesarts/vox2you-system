const API_URL = 'https://vox2you-system-978034491078.us-central1.run.app/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    login: async (email, password) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Login falhou');
        }
        return response.json();
    },

    // Leads
    fetchLeads: async () => {
        const response = await fetch(`${API_URL}/leads`, { headers: getHeaders() });
        return response.json();
    },
    createLead: async (leadData) => {
        const response = await fetch(`${API_URL}/leads`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(leadData)
        });
        return response.json();
    },
    updateLeadStage: async (id, stage) => {
        const response = await fetch(`${API_URL}/leads/${id}/stage`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ stage })
        });
        return response.json();
    },

    // Students
    fetchStudents: async () => {
        const response = await fetch(`${API_URL}/students`, { headers: getHeaders() });
        return response.json();
    },
    enrollStudent: async (enrollData) => {
        const response = await fetch(`${API_URL}/students/enroll`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(enrollData)
        });
        if (!response.ok) throw new Error('Falha na matrícula');
        return response.json();
    },

    // Users
    fetchUsers: async () => {
        const response = await fetch(`${API_URL}/users`, { headers: getHeaders() });
        return response.json();
    },
    createUser: async (userData) => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Falha ao criar usuário');
        }
        return response.json();
    },
    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) throw new Error('Falha ao deletar usuário');
        return response.json();
    }
    // System Health
    checkSystemHealth: async () => {
        const response = await fetch(`${API_URL}/health/full`, { headers: getHeaders() });
        if (!response.ok) throw new Error('Falha no Health Check');
        return response.json();
    }
};

export const fetchLeads = api.fetchLeads;
export const createLead = api.createLead;
export const updateLeadStage = api.updateLeadStage;
export const fetchStudents = api.fetchStudents;
export const enrollStudent = api.enrollStudent;
export const fetchUsers = api.fetchUsers;
export const createUser = api.createUser;
export const deleteUser = api.deleteUser;
