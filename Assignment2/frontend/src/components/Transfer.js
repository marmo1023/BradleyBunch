import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Transfer() {
    const [fromType, setFromType] = useState('checking');
    const [toUserId, setToUserId] = useState('');
    const [toAccountIndex, setToAccountIndex] = useState(0);
    const [amount, setAmount] = useState('');
    const navigate = useNavigate();

    const handleTransfer = async () => {
        const res = await fetch('http://localhost:5000/api/transfers/external', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromType,
                toUserId,
                toAccountIndex: parseInt(toAccountIndex),
                amount: parseFloat(amount),
                category: 'transfer'
            })
        });

        const data = await res.json();
        if (data.success) {
            alert('Transfer successful');
            navigate('/account');
        } else {
            alert(data.error);
        }
    };

    return (
        <div>
            <h2>Transfer Funds</h2>

            <label>From Your Account:</label>
            <select value={fromType} onChange={e => setFromType(e.target.value)}>
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="other">Other</option>
            </select>

            <label>Recipient's User ID:</label>
            <input
                value={toUserId}
                onChange={e => setToUserId(e.target.value)}
                placeholder="Enter recipient ID"
            />

            <label>Recipient's Account Type:</label>
            <select value={toAccountIndex} onChange={e => setToAccountIndex(e.target.value)}>
                <option value={0}>Checking</option>
                <option value={1}>Savings</option>
                <option value={2}>Other</option>
            </select>

            <label>Amount:</label>
            <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
            />

            <button onClick={handleTransfer}>Transfer</button>
            <button onClick={() => navigate('/account')}>Cancel</button>
        </div>
    );
}