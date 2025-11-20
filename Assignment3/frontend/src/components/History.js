import React, { useState, useEffect, useRef } from "react";
import { Chart } from 'chart.js/auto';

export default function History() {
    const [transactions, setTransactions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [showChart, setShowChart] = useState(false);

    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

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

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, []);

    const filterByType = (type) => {
        if (type === 'all') setFiltered(transactions);
        else setFiltered(transactions.filter(tx => tx.accountType === type));
        setShowChart(false);
    };

    const createChart = async () => {
        if (!chartRef.current) return;

        // Destroy previous chart instance if it exists
        if (chartInstanceRef.current) chartInstanceRef.current.destroy();

        try {
            const totalsRes = await fetch('http://localhost:5000/api/transactions/summary/categories', { credentials: 'include' });

            if (!totalsRes.ok) {
                const text = await totalsRes.text();
                throw new Error(`Totals fetch failed: ${text}`);
            }

            const summary = {};
            filtered.forEach(tx => {
                if (!summary[tx.category]) summary[tx.category] = 0;
                summary[tx.category] += tx.amount;
            });

            const labels = Object.keys(summary);
            const values = Object.values(summary);

            const ctx = chartRef.current.getContext('2d');

            chartInstanceRef.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels,
                    datasets: [{
                        label: 'Total by Category',
                        data: values,
                        backgroundColor: [
                            '#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0', '#00BCD4'
                        ],
                        borderColor: '#fff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true, plugins: { legend: { position: 'right' } },
                    onClick: (event, activeElements) => {
                        if (activeElements.length > 0) {
                            const index = activeElements[0].index;
                            console.log('Clicked category:', labels[index], 'Total:', values[index]);
                        }
                    }
                }
            });
        } catch (err) { console.error('Chart creation error:', err); }
    };

    return (
        <div>
            <header></header>
            <h1>Transaction History</h1>
            <div className="filterBySection">
                <h3>Filter By:</h3>
                <button className="buttons" onClick={() => filterByType('savings')}>Savings</button>
                <button className="buttons" onClick={() => filterByType('checking')}>Checking</button>
                <button className="buttons" onClick={() => filterByType('other')}>Other</button>
                <button className="buttons" onClick={() => filterByType('all')}>All</button>
            </div>
            <table className="historyTable" border="1" cellPadding="5" cellSpacing="0">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Account</th>
                        <th>Category</th>
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
                <button className="buttons" onClick={() => window.history.back()}>Cancel</button>
                <button className="buttons" onClick={() => {
                    setShowChart(true)
                    createChart();
                }}>Show Pie Chart</button>
                {showChart && (
                    <div className="pieChart">
                        <canvas ref={chartRef}></canvas>
                    </div>
                )}
            </div>
        </div>
    );
}