import React, { useState, useEffect, useRef } from "react";
import { Chart } from 'chart.js/auto';

export default function History() {
    const [transactions, setTransactions] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [category, setCategory] = useState([]);
    const [dataSet, setDataSet] = useState([]);

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
    };


    const createChart = () => {
        // get the totals for the dataset
        fetch('http://localhost:5000/api/transactions/summary/categories', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                const cat = data.data;
                setDataSet(cat);
                console.log("array for DATA SET is: " + cat);
            })

        // get the names of the categories
        fetch('http://localhost:5000/api/categories/', {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                const names = data.data;
                setDataSet(names);
                console.log("array for NAMES is: " + names);
            })

        // code for the chart below:
        if (!chartRef.current) return;

        // Destroy existing chart if it exists
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        chartInstanceRef.current = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: category,
                datasets: [{
                    label: 'My Data',
                    data: dataSet,
                    borderColor: 'rgb(66, 104, 69)',
                    backgroundColor: 'rgba(66, 104, 69, 0.2)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        const value = dataSet[index];
                        console.log('Clicked:', value);
                    }
                },
                responsive: true,
                maintainAspectRatio: true
            }
        });
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
            </div>

            <div>
                <button onClick={createChart}>
                    Show Pie Chart
                </button>
                <div class="pieChart">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>
        </div>
    );
}