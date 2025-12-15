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
    }
};


export const fetchLeads = async () => {
    const response = await fetch(`${API_URL}/leads`, { headers: getHeaders() });
    return response.json();
};

export const createLead = async (leadData) => {
    const response = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(leadData)
    });
    return response.json();
};

export const updateLeadStage = async (id, stage) => {
    const response = await fetch(`${API_URL}/leads/${id}/stage`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ stage })
    });
    return response.json();
};

export const fetchStudents = async () => {
    const response = await fetch(`${API_URL}/students`, { headers: getHeaders() });
    return response.json();
};

export const enrollStudent = async (enrollData) => {
    const response = await fetch(`${API_URL}/students/enroll`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(enrollData)
    });
    if (!response.ok) throw new Error('Falha na matrícula');
    return response.json();
};

export const fetchUsers = async () => {
    const response = await fetch(`${API_URL}/users`, { headers: getHeaders() });
    return response.json();
};

export const createUser = async (userData) => {
    const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Falha ao criar usuário');
    return response.json();
};

export const deleteUser = async (id) => {
    const response = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    if (!response.ok) throw new Error('Falha ao deletar usuário');
    return response.json();
};
