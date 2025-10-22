import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";

export default function HomePageDisplay() {
    const navigate = useNavigate();

    // states
    const [showHomepage, setShowHomepage] = useState(true);
    const [showMainpage, setShowMainpage] = useState(false);
    const [showBuySellpage, setShowBuySellpage] = useState(false);

    const [moneyValue, setMoneyValue] = useState();
    var slider = document.getElementById("myRange");
    var output = document.getElementById("value")




    async function homeToMain(e) {
        e.preventDefault();

        setShowHomepage(false);
        setShowMainpage(true);
        // change visibility of the divs below here
    }

    async function mainToBuySell(e) {
        e.preventDefault();

        setShowHomepage(false);
        setShowMainpage(false);
        setShowBuySellpage(true);
        // change visibility of the divs below here
    }

    async function saveValue(e) {


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
                            <input type="text" value="Enter Dollar Amount" />
                        </div>
                        <div class="slidecontainer">
                            <input type="range" min="0" max="100" defaultValue="50" class="slider" id="myRange"></input>
                            <p>Value: <span id="value"></span></p>
                        </div>
                    </div>


                    <div>
                        <h2>Selected amount: ${/*put variabl here*/}</h2>
                        <input class="buttonSubmit"
                            type="submit"
                            value="Buy"

                            onClick={saveValue}
                        />
                        <input class="buttonSubmit"
                            type="submit"
                            value="Sell"

                            onClick={saveValue}
                        />
                    </div>
                </div>

            </div>
            )}

            {/*End of main div*/}
        </div>
    )
}