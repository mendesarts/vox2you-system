import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, DollarSign, ArrowDown, ArrowUp, Briefcase, Layers, BrainCircuit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '../../components/ErrorBoundary';
import FinancialManager from './FinancialManager';
import CashFlowManager from './CashFlowManager';
import DREReport from './DREReport';
import FinancialCategories from './FinancialCategories';
import HelpButton from '../../components/HelpButton';
import AIAdvisorModal from '../components/AIAdvisorModal';

const FinancialDashboard = () => {
    const [stats, setStats] = useState({
        receivableAmount: 0,
        payableAmount: 0,
        revenueData: []
    });

    const [view, setView] = useState('analysis');
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);

    const renderTabs = () => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '14px', width: 'fit-content' }}>
                {[
                    { id: 'analysis', label: 'Análise' },
                    { id: 'records', label: 'Lançamentos' },
                    { id: 'dre', label: 'DRE' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: '600',
                            fontSize: '13px',
                            cursor: 'pointer',
                            background: view === tab.id ? '#fff' : 'transparent',
                            color: view === tab.id ? '#000' : '#8E8E93',
                            boxShadow: view === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <button
                onClick={() => setShowAIAdvisor(true)}
                style={{
                    background: 'linear-gradient(135deg, #2ae0c8 0%, #00c7b1 100%)', // Vox Teal Gradient
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 24px',
                    fontWeight: '800',
                    fontSize: '14px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(42, 224, 200, 0.25)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <BrainCircuit size={18} /> Análise IA
            </button>
        </div>
    );

    const renderContent = () => {
        switch (view) {
            case 'analysis': return <FinancialCategories />;
            case 'dre': return <DREReport />;
            case 'records':
            default:
                return <FinancialManager />;
        }
    };

    return (
        <div className="page-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {renderTabs()}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {renderContent()}
            </div>

            {showAIAdvisor && <AIAdvisorModal onClose={() => setShowAIAdvisor(false)} />}

            <HelpButton context={
                view === 'analysis' ? 'financial_analysis' :
                    view === 'cashflow' ? 'cash_flow' :
                        view === 'records' ? 'financial_records' :
                            view === 'dre' ? 'dre' :
                                'financial_dashboard'
            } />
        </div>
    );
};

export default function FinancialDashboardWithBoundary() {
    return (
        <ErrorBoundary>
            <FinancialDashboard />
        </ErrorBoundary>
    );
}
