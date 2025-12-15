import React, { useState, useEffect } from 'react';

const CurrencyInput = ({ value, onChange, placeholder, className, required }) => {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        setDisplayValue(format(value));
    }, [value]);

    const format = (val) => {
        if (val === '' || val === null || val === undefined) return '';
        const number = parseFloat(val);
        if (isNaN(number)) return '';
        return number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleChange = (e) => {
        // Remove non-numeric characters
        let val = e.target.value.replace(/\D/g, '');

        // Convert to number (cents)
        const numberVal = val ? parseFloat(val) / 100 : 0;

        // Call parent with number
        onChange(numberVal);
    };

    return (
        <div className={`currency-input-container ${className || ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', pointerEvents: 'none' }}>R$</span>
            <input
                type="text"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder || '0,00'}
                required={required}
                data-type="currency"
                style={{ paddingLeft: '40px', width: '100%', borderRadius: '6px', border: '1px solid var(--border)', padding: '10px 10px 10px 40px', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
            />
        </div>
    );
};

export default CurrencyInput;
