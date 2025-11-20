import React, { useState } from 'react';

export default function Exchange() {
    const [accountType, setAccountType] = useState('checking');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');

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
        if (data.success) window.history.back();
        else alert(data.error);
    };

    return (
        <div>
            <header></header>
            <h1>Deposit / Withdraw</h1>
            <div className="exchangeContainer">
                <div className="container2">
                    <label>Account Type:</label>
                    <select className="textbox" value={accountType} onChange={e => setAccountType(e.target.value)}>
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div className="container2">
                    <label>Amount:</label>
                    <input
                        className="textbox"
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Enter amount"
                    />
                </div>
                <div className="container2">
                    <label>Category:</label>
                    <input
                        className="textbox"
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        placeholder="Enter category"
                    />
                </div>
            </div>
            <div>
                <button className="buttons" onClick={() => handleExchange('deposit')}>Deposit</button>
                <button className="buttons" onClick={() => handleExchange('withdraw')}>Withdraw</button>
                <button className="buttons" onClick={() => window.history.back()}>Cancel</button>
            </div>
        </div>
    );
}