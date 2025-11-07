import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Select() {
    const navigate = useNavigate();

    const goToAccount = (type) => {
        navigate('/account', { state: { accountType: type } });
    };

    return (
        <div>
            <h2>Select Account</h2>
            <button onClick={() => goToAccount('savings')}>Savings</button>
            <button onClick={() => goToAccount('checking')}>Checking</button>
            <button onClick={() => goToAccount('other')}>Other</button>
        </div>
    );
}