import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Exchange() {
    const [accountType, setAccountType] = useState('checking');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const navigate = useNavigate();

    const handleExchange = async (type) => {
        const res = await fetch(`http://localhost:5000/api/accounts/${type}`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accountType,
                amount: parseFloat(amount),
                category
            })
        });
        const data = await res.json();
        if (data.success) navigate('/account');
        else alert(data.error);
    };

    return (
        <div>
            <h2>Deposit / Withdraw</h2>

            <label>Account Type:</label>
            <select value={accountType} onChange={e => setAccountType(e.target.value)}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="other">Other</option>
            </select>

            <label>Amount:</label>
            <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
            />

            <label>Category:</label>
            <input
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Enter category"
            />

            <button onClick={() => handleExchange('deposit')}>Deposit</button>
            <button onClick={() => handleExchange('withdraw')}>Withdraw</button>
            <button onClick={() => navigate('/account')}>Cancel</button>
        </div>
    );
}