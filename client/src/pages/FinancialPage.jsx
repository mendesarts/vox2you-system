import React from 'react';
import FinancialDashboard from './administrative/FinancialDashboard';
import { DollarSign, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const FinancialPage = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Render the core Financial Dashboard component */}
            <FinancialDashboard />
        </div>
    );
};

export default FinancialPage;
