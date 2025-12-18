import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import SidebarSlim from './components/SidebarSlim';
import Dashboard from './pages/Dashboard';
import CRMBoard from './pages/CRMBoard';
import CalendarPage from './pages/CalendarPage';
import AdministrativePage from './pages/Secretary'; // Renamed conceptually
import PedagogicalPage from './pages/PedagogicalPage';
import Settings from './pages/Settings';
import TasksPage from './pages/TasksPage';
import Login from './pages/Login';
import UsersPage from './pages/UsersPage';
import SystemHealth from './pages/admin/SystemHealth';
import WhatsAppMarketing from './pages/commercial/WhatsAppMarketing';
import './app.css';

const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div>Carregando...</div>;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const Layout = () => {
    return (
        <div className="app-container">
            <SidebarSlim />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

function App() {
    // Theme State with Persistence
    const [isLightMode, setIsLightMode] = useState(() => {
        return localStorage.getItem('theme') === 'light';
    });

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isLightMode]);

    const toggleTheme = () => setIsLightMode(!isLightMode);

    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<Layout />}>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/tasks" element={<TasksPage />} />
                            <Route path="/administrative" element={<AdministrativePage />} />
                            <Route path="/crm" element={<CRMBoard />} />
                            <Route path="/commercial/whatsapp-marketing" element={<WhatsAppMarketing />} />
                            <Route path="/pedagogical" element={<PedagogicalPage />} />
                            <Route path="/calendar" element={<CalendarPage />} />
                            <Route path="/users" element={<UsersPage />} />
                            <Route path="/admin/system-status" element={<SystemHealth />} />
                            <Route path="/settings" element={<Settings isLightMode={isLightMode} toggleTheme={toggleTheme} />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}


export default App;
