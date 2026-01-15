// Reverted to Env Var with Fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        const response = await fetch(`${API_URL}/crm/leads`, { headers: getHeaders() });
        return response.json();
    },
    createLead: async (leadData) => {
        const response = await fetch(`${API_URL}/crm/leads`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(leadData)
        });
        return response.json();
    },
    updateLeadStage: async (id, stage) => {
        const response = await fetch(`${API_URL}/crm/leads/${id}/move`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status: stage })
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
    fetchUsers: async (queryString = '') => {
        const url = queryString ? `${API_URL}/users${queryString}` : `${API_URL}/users`;
        const response = await fetch(url, { headers: getHeaders() });
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
    updateUser: async (id, userData) => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Falha ao atualizar usuário');
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
    },

    // System Health
    verificarSaudeDoSistema: async () => {
        const response = await fetch(`${API_URL}/health/full`, { headers: getHeaders() });
        if (!response.ok) {
            let msg = 'Falha no Health Check';
            try {
                const data = await response.json();
                msg = data.message || data.error || msg;
            } catch (e) { }
            throw new Error(msg);
        }
        return response.json();
    },

    // Generic HTTP Methods
    get: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, { headers: getHeaders() });
        if (!response.ok) {
            let errMsg = `GET ${endpoint} failed`;
            try {
                const errData = await response.json();
                errMsg = errData.error || errData.message || errMsg;
            } catch (e) { }
            throw new Error(errMsg);
        }
        return response.json();
    },
    post: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            let errMsg = `POST ${endpoint} failed`;
            try {
                const errData = await response.json();
                errMsg = errData.error || errData.message || errMsg;
            } catch (e) { }
            throw new Error(errMsg);
        }
        return response.json();
    },
    put: async (endpoint, data) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            let errMsg = `PUT ${endpoint} failed`;
            try {
                const errData = await response.json();
                errMsg = errData.error || errData.message || errMsg;
            } catch (e) { }
            throw new Error(errMsg);
        }
        return response.json();
    },
    delete: async (endpoint) => {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!response.ok) {
            let errMsg = `DELETE ${endpoint} failed`;
            try {
                const errData = await response.json();
                errMsg = errData.error || errData.message || errMsg;
            } catch (e) { }
            throw new Error(errMsg);
        }
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
export const updateUser = api.updateUser;
export const deleteUser = api.deleteUser;

export default api;
