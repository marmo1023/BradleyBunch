import yahooFinance from 'yahoo-finance2';

//source: https://jsr.io/@gadicc/yahoo-finance2/doc/modules/chart

//gets data from yahoo finance from the ticker
export async function getStocks(ticker) {
  try {
    const history = await yahooFinance.historical(ticker, {
      period1: '2000-01-01',
      interval: '1d',
    });

    if (!history || history.length < 180) {
      throw new Error('Insufficient historical data');
    }

    return history.map(day => ({
      date: day.date,
      close: day.close,
    }));
  } catch (err) {
    throw { status: 400, message: `Failed to fetch data for ticker: ${ticker}` };
  }
}