import express from 'express';
import { getStocks } from '../services/yahoo.js';
import { initializeSimulation, executeTrade } from '../services/simulation.js';

const router = express.Router();

//initializes with a ticker symbol
router.post('/initialize', async (req, res) => {
  const { ticker } = req.body;
  try {
    const prices = await getStocks(ticker);
    //180 days is approximately 6 months
    if (!prices || prices.length < 180) {
      return res.status(400).send('Not enough data');
    }
    //start simulation
    const initialPrice = initializeSimulation(ticker, prices);
    //send price
    res.json({ initialPrice });
  } catch (err) {
    res.status(500).send('Cannot get data for selected ticker');
  }
});

//function for trading stock
router.post('/trade', (req, res) => {
  //action = buy, sell, hold or quit; amount is how many stocks
  const { action, amount } = req.body;

  //executes trade
  const result = executeTrade(action, amount);
  if (!result) return res.status(400).send('Not enough data');
  res.json(result);
});

export default router;