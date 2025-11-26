const express = require('express');

module.exports = (dbInstance) => {
  const router = express.Router();
  const scores = dbInstance.getDb().collection('scores');

  //Route: Saves a new score to DB
  router.post('/', async (req, res) => {
    try {
      const {playerName, phrase, guesses, fromDatabase, success, gameId, roundNumber } = req.body;
      //Null check
      if (!playerName || !phrase) return res.status(400).json({ error: 'Missing required fields' });

      //Add score to DB
      await scores.insertOne({
        playerName,
        phrase,
        guesses: Array.isArray(guesses) ? guesses : [],
        fromDatabase: !!fromDatabase,
        success: !!success,
        gameId: gameId || null,
        roundNumber: roundNumber || null,
        createdAt: new Date()
      });

      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to save score' }); }
  });

  //Route: Get all scores from DB
  router.get('/', async (req, res) => {
    try {
      const allScores = await scores.find().sort({ createdAt: -1 }).toArray();
      res.json(allScores.map(s => ({
        playerName: s.playerName,
        phrase: s.phrase,
        guesses: s.guesses || [],
        fromDatabase: !!s.fromDatabase,
        success: !!s.success,
        gameId: s.gameId || null,
        roundNumber: s.roundNumber || null,
        createdAt: s.createdAt
      })));
    } catch (err) { res.status(500).json({ error: 'Failed to fetch scores' }); }
  });

  return router;
};