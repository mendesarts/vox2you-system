import React, { useState, useEffect } from 'react';
import { Calendar, Filter, ChevronDown, Check } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subWeeks } from 'date-fns';

const DashboardFilters = ({ onFilterChange, loading = false, user }) => {
    // Unit logic removed - handled globally

    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Initialize filters on mount
    useEffect(() => {
        applyPeriod('all');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount to kickstart the dashboard

    const applyPeriod = (period) => {
        const now = new Date();
        let start, end;

        switch (period) {
            case 'all':
                start = null;
                end = null;
                break;
            case 'today':
                start = now;
                end = now;
                break;
            case 'yesterday':
                start = subDays(now, 1);
                end = subDays(now, 1);
                break;
            case 'week':
                start = startOfWeek(now, { weekStartsOn: 1 });
                end = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'last-week':
                const lastWeek = subWeeks(now, 1);
                start = startOfWeek(lastWeek, { weekStartsOn: 1 });
                end = endOfWeek(lastWeek, { weekStartsOn: 1 });
                break;
            case 'month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'year':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
            case 'custom':
                setSelectedPeriod('custom');
                return;
            default:
                start = null;
                end = null;
        }

        const sStr = start ? format(start, 'yyyy-MM-dd') : '';
        const eStr = end ? format(end, 'yyyy-MM-dd') : '';

        setStartDate(sStr);
        setEndDate(eStr);
        setSelectedPeriod(period);
        setStartDate(sStr);
        setEndDate(eStr);
        setSelectedPeriod(period);
        triggerChange(sStr, eStr, period);
    };

    const handleCustomDateChange = (type, val) => {
        let newStart = startDate;
        let newEnd = endDate;

        if (type === 'start') {
            setStartDate(val);
            newStart = val;
            if (endDate && val > endDate) setEndDate(val);
        } else {
            setEndDate(val);
            newEnd = val;
            if (startDate && val < startDate) setStartDate(val);
        }
        triggerChange(newStart, newEnd, 'custom');
    };

    const triggerChange = (start, end, period) => {
        if (onFilterChange) {
            onFilterChange({
                // Unit ID is removed, handled by parent/context
                startDate: start,
                endDate: end,
                period: period
            });
        }
    };

    return (
        <div className="filter-bar-ios animate-in slide-in-from-top-2 duration-500">
            {/* Left Side: Unit Filter REMOVED - Handled Globally by Layout */}
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}> ... </div> */}

            {/* Right Side: Period & Date Range */}

            {/* Right Side: Period & Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflowX: 'auto' }}>

                {/* Period Chips (Compact) */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    {['all', 'today', 'month', 'custom'].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => applyPeriod(opt)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '700',
                                border: 'none',
                                cursor: 'pointer',
                                background: selectedPeriod === opt ? '#34C759' : 'transparent',
                                color: selectedPeriod === opt ? '#fff' : '#8E8E93',
                                transition: 'all 0.2s'
                            }}
                        >
                            {opt === 'all' && 'Tudo'}
                            {opt === 'today' && 'Hoje'}
                            {opt === 'month' && 'Mês'}
                            {opt === 'custom' && 'Filtro'}
                        </button>
                    ))}
                </div>

                <div style={{ width: '1px', height: '20px', background: 'rgba(0,0,0,0.1)' }}></div>

                {/* Date Inputs */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.03)', padding: '6px 12px', borderRadius: '12px', flexShrink: 0 }}>
                    <Calendar size={14} color="#8E8E93" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#1C1C1E', padding: 0, margin: 0, width: 'auto' }}
                    />
                    <span style={{ color: '#8E8E93' }}>-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#1C1C1E', padding: 0, margin: 0, width: 'auto' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardFilters;
