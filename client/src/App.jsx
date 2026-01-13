import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import CRMBoard from './pages/CRMBoard';
import MarketingPage from './pages/commercial/WhatsAppMarketing';
import UsersPage from './pages/UsersPage';
import FinancialPage from './pages/FinancialPage';
import PersonalFinance from './pages/administrative/PersonalFinance';
import PedagogicalPage from './pages/PedagogicalPage';
import Secretary from './pages/Secretary';
import AgendaPage from './pages/AgendaPage';
import CommercialDashboard from './pages/CommercialDashboard';
import CoursesSettings from './pages/CoursesSettings';
import TasksPage from './pages/TasksPage';
import ManualMapper from './pages/ManualMapper';
import SystemHealth from './pages/admin/SystemHealth';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div>Carregando...</div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/crm" element={<CRMBoard />} />
                        <Route path="/marketing" element={<MarketingPage />} />
                        <Route path="/financial" element={<FinancialPage />} />
                        <Route path="/financial/personal" element={<PersonalFinance />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/pedagogical" element={<PedagogicalPage />} />
                        <Route path="/secretary" element={<Secretary />} />
                        <Route path="/calendar" element={<AgendaPage />} />
                        <Route path="/commercial" element={<CommercialDashboard />} />
                        <Route path="/courses" element={<CoursesSettings />} />
                        <Route path="/tasks" element={<TasksPage />} />
                        <Route path="/manual-mapper" element={<ManualMapper />} />
                        <Route path="/admin/health" element={<SystemHealth />} />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
