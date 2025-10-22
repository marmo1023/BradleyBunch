import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Chart } from 'chart.js/auto';

export default function HomePageDisplay() {
    const navigate = useNavigate();
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    // states
    const [showHomepage, setShowHomepage] = useState(true);
    const [showMainpage, setShowMainpage] = useState(false);
    const [showBuySellpage, setShowBuySellpage] = useState(false);

    // value of the money chosen by the user
    const [moneyValue, setMoneyValue] = useState();


    // values for the chart
    const [labels, setLabels] = useState(['label1', 'label2', 'label3', 'label4', 'label5', 'label6', 'label7', 'label8', 'label9', 'label10']);
    const [dataSet, setDataSet] = useState([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    useEffect(() => {
        if (showBuySellpage && chartRef.current) {
            // Destroy existing chart if it exists
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

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
        setMoneyValue(e.target.value);
    }

    async function homeToMain(e) {
        e.preventDefault();

        setShowHomepage(false);
        setShowMainpage(true);
    }

    async function mainToBuySell(e) {
        e.preventDefault();

        setShowHomepage(false);
        setShowMainpage(false);
        setShowBuySellpage(true);
    }


    return (
        <div class="main">  {/*Main div*/}

            {/* This is the HTML for the HOME PAGE */}
            {showHomepage && (<div class="Homepage">
                <header></header>
                <h2>Enter Desired Ticker Symbol</h2>
                <div class="box1">
                    <input type="text" id="tickersym" name="tickersym" placeholder="Enter ticker symbol..."></input>
                    <input class="buttonSubmit"
                        type="submit"
                        value="Submit"

                        onClick={homeToMain}
                    />
                </div>

            </div>
            )}


            {/* This is the HTML for the MAIN PAGE */}
            {showMainpage && (<div class="Mainpage">

                <header>
                    <div class="displayInfo">
                        <p>Current Ticker: ${/*put variable here*/}</p>
                        <p>Days Played: ${/*put variable here*/}</p>
                        <p>Overall Gain ${/*put variable here*/}</p>
                        <p>Bank: ${/*put variable here*/}</p>
                    </div>
                </header>


                <div class="buttonContainer">
                    <input class="buttonMain"
                        type="submit"
                        value="BUY / SELL"

                        onClick={mainToBuySell}
                    />
                    <div class="holdQuit">
                        <input class="buttonMain"
                            type="submit"
                            value="HOLD"

                        // onClick={}
                        />
                        <input class="buttonMain"
                            type="submit"
                            value="QUIT"

                        // onClick={}
                        />
                    </div>
                </div>

            </div>
            )}


            {/* This is the HTML for the Buy/Sell PAGE */}
            {showBuySellpage && (<div class="buysellpage">

                <header>
                    <div class="displayInfo">
                        <p>Current Ticker: ${/*put variable here*/}</p>
                        <p>Days Played: ${/*put variable here*/}</p>
                        <p>Overall Gain ${/*put variable here*/}</p>
                        <p>Bank: ${/*put variable here*/}</p>
                    </div>
                </header>

                <div class="buySellMainDiv">
                    <div class="buySellLeft">
                        <div class="enterAmountDiv">
                            <p>Enter Amount</p>
                            <input type="text" placeholder="Enter Dollar Amount" value={moneyValue}
                                onChange={handleSliderChange} />
                        </div>
                        <div class="slidecontainer">
                            <input type="range" min="0" max="100" value={moneyValue} class="slider" id="myRange" onChange={handleSliderChange}></input>
                            <p>Value: {moneyValue}</p>
                        </div>
                        <div className="chart-container">
                            <canvas ref={chartRef} id="myChart"></canvas>
                        </div>

                    </div>


                    <div>
                        <h2>Selected amount: ${/*put variabl here*/}</h2>
                        <input class="buttonSubmit"
                            type="submit"
                            value="Buy"
                        // onClick={saveValue}
                        />
                        <input class="buttonSubmit"
                            type="submit"
                            value="Sell"
                        // onClick={saveValue}
                        />
                    </div>
                </div>

            </div>
            )}

            {/*End of main div*/}
        </div>
    )
}