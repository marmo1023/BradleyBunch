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
            <header></header>
            <h1>Deposit / Withdraw</h1>

            <div class="exchangeContainer">
                <div class="container2">
                    <label>Account Type:</label>
                    <select class="textbox" value={accountType} onChange={e => setAccountType(e.target.value)}>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div class="container2">
                    <label>Amount:</label>
                    <input
                        class="textbox"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Enter amount"
                    />
                </div>

                <div class="container2">
                    <label>Category:</label>
                    <input
                        class="textbox"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="Enter category"
                    />
                </div>

            </div>

            <div>
                <button class="buttons" onClick={() => handleExchange('deposit')}>Deposit</button>
                <button class="buttons" onClick={() => handleExchange('withdraw')}>Withdraw</button>
                <button class="buttons" onClick={() => navigate('/account')}>Cancel</button>
            </div>
        </div>
    );
}