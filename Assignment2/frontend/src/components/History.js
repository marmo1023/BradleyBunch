import React, { useEffect, useState } from 'react';

export default function History() {
    const [transactions, setTransactions] = useState([]);
    const [filtered, setFiltered] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/transactions/all', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                const txs = data.data || [];
                setTransactions(txs);
                setFiltered(txs);
            });
    }, []);

    const filterByType = (type) => {
        if (type === 'all') {
            setFiltered(transactions);
        } else {
            setFiltered(transactions.filter(tx => tx.accountType === type));
        }
    };

    return (
        <div>
            <header></header>
            <h1>Transaction History</h1>


            <div class="filterBySection">
                <h3>Filter By:</h3>
                <button class="buttons" onClick={() => filterByType('savings')}>Savings</button>
                <button class="buttons" onClick={() => filterByType('checking')}>Checking</button>
                <button class="buttons" onClick={() => filterByType('other')}>Other</button>
                <button class="buttons" onClick={() => filterByType('all')}>All</button>
            </div>

            <table class="historyTable" border="1" cellPadding="5" cellSpacing="0">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Account</th>
                        <th>Category</th>
                    </tr>
                    <tr>
                        <td>Test</td>
                        <td>Test</td>
                        <td>Test</td>
                        <td>Test</td>
                        <td>Test</td>
                    </tr>
                    <tr>
                        <td>Test</td>
                        <td>Test</td>
                        <td>Test</td>
                        <td>Test</td>
                        <td>Test</td>
                    </tr>
                </thead>
                <tbody>
                    {filtered.map((tx, i) => (
                        <tr key={i}>
                            <td>{new Date(tx.timestamp).toLocaleString()}</td>
                            <td>${tx.amount.toFixed(2)}</td>
                            <td>{tx.type}</td>
                            <td>{tx.accountType}</td>
                            <td>{tx.category}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div>
                <button class="buttons" onClick={() => window.history.back()}>Cancel</button>
            </div>
        </div>
    );
}