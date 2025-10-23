import React, { useState, useEffect, useRef } from "react";
import { Chart } from 'chart.js/auto';

export default function HomePageDisplay() {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    //UI states
    const [showHomepage, setShowHomepage] = useState(true);
    const [showMainpage, setShowMainpage] = useState(false);
    const [showBuySellpage, setShowBuySellpage] = useState(false);

    //simulation states
    const [ticker, setTicker] = useState('');
    const [currentPrice, setCurrentPrice] = useState(null);
    const [cashReserve, setCashReserve] = useState(10000);
    const [equityHoldings, setEquityHoldings] = useState(0);
    const [daysSimulated, setDaysSimulated] = useState(0);
    const [overallGain, setOverallGain] = useState(0);

    // value of the money chosen by the user
    const [moneyValue, setMoneyValue] = useState(0);

    // values for the chart
    const [labels, setLabels] = useState(['label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8', 'label9', 'label10']);
    const [dataSet, setDataSet] = useState([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    useEffect(() => {
        if (showBuySellpage && chartRef.current) {
            // Destroy existing chart if it exists
            if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); }
            const ctx = chartRef.current.getContext('2d');

            chartInstanceRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '',
                        data: dataSet,
                        borderColor: 'rgb(66, 104, 69)',
                        backgroundColor: 'rgb(66, 104, 69, 0.2)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    onClick: (event, activeElements) => {
                        if (activeElements.length > 0) {
                            const index = activeElements[0].index;
                            const value = dataSet[index];
                            setMoneyValue(value);
                        }
                    },
                    responsive: true
                }
            });
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };


    }, [showBuySellpage, labels, dataSet]);

    function handleSliderChange(e) {
        setMoneyValue(Number(e.target.value));
    }

    async function homeToMain(e) {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker }),
            });
            const data = await response.json();
            if (!ticker) {
                alert('Please enter a ticker symbol.');
                return;
            }
            if (!response.ok) {
                throw new Error(data.error || 'Ticker not found or insufficient data');
            }
            setCurrentPrice(data.initialPrice);
            setShowHomepage(false);
            setShowMainpage(true);
        } catch (err) {
            alert(err.message);
        }
    }

    async function mainToBuySell(e) {
        e.preventDefault();

        setShowHomepage(false);
        setShowMainpage(false);
        setShowBuySellpage(true);
    }

    //sends trades
    async function sendTrade(action) {
        try {
            if (isNaN(moneyValue) || moneyValue <= 0) {
                alert('Please enter a valid dollar amount.');
                return;
            }
            const response = await fetch('http://localhost:5000/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, amount: parseFloat(moneyValue) }),
            });

            const data = await response.json();

            if (action === 'quit' || data.simulationEnded) {
                alert(`Simulation ended. Final balance: $${data.finalBalance}`);
                window.location.reload();
            } else {
                setCurrentPrice(data.nextPrice);
                setCashReserve(data.cashReserve);
                setEquityHoldings(data.equityHoldings);
                setDaysSimulated(prev => prev + 1);
                setOverallGain(data.cashReserve + data.equityHoldings * data.nextPrice - 10000);
            }
        } catch (err) {
            alert('Trade failed: ' + err.message);
        }
    }

    return (
        <div className="main">  {/*Main div*/}

            {/* This is the HTML for the HOME PAGE */}
            {showHomepage && (<div className="Homepage">
                <header></header>
                <h2>Enter Desired Ticker Symbol</h2>
                <div className="box1">
                    <input
                        type="text"
                        id="tickersym"
                        name="tickersym"
                        placeholder="Enter ticker symbol..."
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.trim().toUpperCase())}
                    />
                    <input
                        className="buttonSubmit"
                        type="submit"
                        value="Submit"
                        onClick={homeToMain}
                    />
                </div>
            </div>
            )}

            {/* This is the HTML for the MAIN PAGE */}
            {showMainpage && (<div className="Mainpage">

                <header>
                    <div className="displayInfo">
                        <p>Current Ticker: ${ticker}</p>
                        <p>Days Played: ${daysSimulated}</p>
                        <p>Overall Gain ${overallGain.toFixed(2)}</p>
                        <p>Bank: ${cashReserve.toFixed(2)}</p>
                    </div>
                </header>
                <div className="buttonContainer">
                    <input className="buttonMain"
                        type="submit"
                        value="BUY / SELL"
                        onClick={mainToBuySell}
                    />
                    <div className="holdQuit">
                        <input className="buttonMain"
                            type="submit"
                            value="HOLD"
                            onClick={() => sendTrade('hold')}
                        />
                        <input className="buttonMain"
                            type="submit"
                            value="QUIT"
                            onClick={() => sendTrade('quit')}
                        />
                    </div>
                </div>
            </div>
            )}

            {/* This is the HTML for the Buy/Sell PAGE */}
            {showBuySellpage && (
                <div className="buysellpage">
                    <header>
                        <div className="displayInfo">
                            <p>Current Ticker: ${ticker}</p>
                            <p>Days Played: ${daysSimulated}</p>
                            <p>Overall Gain ${overallGain.toFixed(2)}</p>
                            <p>Bank: ${cashReserve.toFixed(2)}</p>
                        </div>
                    </header>
                    <div className="buySellMainDiv">
                        <div className="buySellLeft">
                            <div className="enterAmountDiv">
                                <p>Enter Amount</p>
                                <input
                                    type="text"
                                    placeholder="Enter Dollar Amount"
                                    value={moneyValue}
                                    onChange={handleSliderChange}
                                />
                            </div>
                            <div className="slidecontainer">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={moneyValue}
                                    className="slider"
                                    id="myRange"
                                    onChange={handleSliderChange}
                                />
                                <p>Value: {moneyValue}</p>
                            </div>
                            <div className="chart-container">
                                <canvas ref={chartRef} id="myChart"></canvas>
                            </div>
                        </div>
                        <div>
                            <h2>Selected amount: ${moneyValue}</h2>
                            <input
                                className="buttonSubmit"
                                type="submit"
                                value="Buy"
                                onClick={() => sendTrade('buy')}
                            />
                            <input
                                className="buttonSubmit"
                                type="submit"
                                value="Sell"
                                onClick={() => sendTrade('sell')}
                            />
                        </div>
                    </div>
                </div>
            )}
            {/*End of main div*/}
        </div>
    )
}