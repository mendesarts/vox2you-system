// ⚠️ ATTENTION: Read ARCHITECTURE_GUIDELINES.md in the root directory before modifying logic related to roles, units, or permissions. Always use numeric roleId [1, 10, etc.] and unitId.
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const [selectedUnit, setSelectedUnit] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && token) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            // Default select user's unit, or 'all' if global?
            // User requested that global users can change it. 
            // We'll initialize with user.unitId (if constrained) or null (all) if they are global?
            // Let's stick to user.unitId as default, but allow null for 'all' if roles permit.
            if (parsed.unitId) setSelectedUnit(Number(parsed.unitId));
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const data = await api.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            if (data.user.unitId) setSelectedUnit(Number(data.user.unitId));
            return data.user;
        } catch (error) {
            console.error("Login context error", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setSelectedUnit(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token, selectedUnit, setSelectedUnit }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
