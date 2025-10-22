import yahooFinance from 'yahoo-finance2';

//source: https://jsr.io/@gadicc/yahoo-finance2/doc/modules/chart

//gets data from yahoo finance from the ticker
export async function getStocks(ticker) {
    const history = await yahooFinance.historical(ticker, {
        period1: '2023-01-01',
        interval: '1d',
    });
    //extracts date and closing price
    return history.map(day => ({
        date: day.date,
        close: day.close,
    }));
}