const express = require('express');

module.exports = (dbInstance) => {
  const router = express.Router();
  const scores = dbInstance.getDb().collection('scores');

  //Route: Saves a new score to DB
  router.post('/', async (req, res) => {
    try {
      const { playerName, outcome, losingCardsRemaining, gameId } = req.body;
      //Null check
      if (!playerName || !outcome) return res.status(400).json({ error: 'Missing required fields' });

      //Add score to DB
      await scores.insertOne({
        playerName,
        outcome,
        losingCardsRemaining,
        gameId: gameId || null,
        createdAt: new Date()
      });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to save score' }); }
  });

  //Route: Get all scores from DB
  router.get('/:name', async (req, res) => {
    try {
      const { name } = req.params;
      //Null check
      if (!name) return res.status(400).json({ error: 'Name required' });
      
      const history = await scores.find({ playerName: name }).sort({ createdAt: -1 }).toArray();
      res.json(history);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch history' }); }
  });

  return router;
};