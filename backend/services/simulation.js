let simulationState = {};

export function initializeSimulation(ticker, prices) {
    //picks a random start date at least 6 months ago
    const startIndex = Math.floor(Math.random() * (prices.length - 180));

    //starts the initial state, $10,000
    simulationState = {
        ticker,
        prices,
        startIndex,
        currentDay: 0,
        cashReserve: 10000,
        equityHoldings: 0,
        transactionHistory: [],
    };
    //returns the initial price (no date)
    return prices[startIndex].close;
}

//processes a trade action and advances a day
export function executeTrade(action, amount) {
    const dayIndex = simulationState.startIndex + simulationState.currentDay;
    const currentPrice = simulationState.prices[dayIndex]?.close;
    //ends if there are no prices
    if (!currentPrice) return null;
    //Buy action: cash to shares
    if (action === 'buy') {
        const shares = amount / currentPrice;
        if (amount <= simulationState.cashReserve) {
            simulationState.cashReserve -= amount;
            simulationState.equityHoldings += shares;
        }
    }
    //Sell action: shares to cash
    else if (action === 'sell') {
        if (amount <= simulationState.equityHoldings) {
            simulationState.cashReserve += amount * currentPrice;
            simulationState.equityHoldings -= amount;
        }
    }
    //Quite action: sells all shares
    else if (action === 'quit') {
        simulationState.cashReserve += simulationState.equityHoldings * currentPrice;
        simulationState.equityHoldings = 0;
        return {
            finalBalance: simulationState.cashReserve,
            totalDaysSimulated: simulationState.currentDay + 1,
        };
    }
    //Hold action: null, just advances day
    simulationState.transactionHistory.push({ day: dayIndex, price: currentPrice, action });

    //next day
    simulationState.currentDay++;
    return {
        nextPrice: simulationState.prices[dayIndex + 1]?.close,
        cashReserve: simulationState.cashReserve,
        equityHoldings: simulationState.equityHoldings,
    };
}