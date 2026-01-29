// ⚠️ ATTENTION: Read ARCHITECTURE_GUIDELINES.md in the root directory before modifying logic related to roles, units, or permissions. Always use numeric roleId [1, 10, etc.] and unitId.
import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    const [selectedUnit, setSelectedUnit] = useState(null);

    // Inactivity timeout duration: 1 hour (3600000 ms)
    const INACTIVITY_LIMIT = 3600000;

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser && token) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            if (parsed.unitId) setSelectedUnit(Number(parsed.unitId));
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        try {
            const data = await api.login(email, password);
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
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
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setSelectedUnit(null);
        window.location.href = '/login'; // Force redirect to ensure clear state
    };

    // Auto-logout on inactivity
    useEffect(() => {
        if (!user) return;

        let inactivityTimer;

        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                console.log("User inactive for 1 hour. Logging out...");
                logout();
            }, INACTIVITY_LIMIT);
        };

        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

        const handleActivity = () => {
            resetTimer();
        };

        // Initial start
        resetTimer();

        // Add listeners
        events.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            events.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [user]); // Re-run when user logs in

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!token, selectedUnit, setSelectedUnit }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
