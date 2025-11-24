const express = require('express');

module.exports = (dbInstance) => {
  const router = express.Router();
  const scores = dbInstance.getDb().collection('scores');

  //Saves score
  router.post('/', async (req, res) => {
    try {
      const { playerName, phrase, guesses, fromDatabase, success } = req.body;
      //Null check
      if (!playerName || !phrase) return res.status(400).json({ error: 'Missing required fields' });

      //Adds scores to DB
      await scores.insertOne({
        playerName,
        phrase,
        guesses: guesses || [],
        fromDatabase: !!fromDatabase,
        success: !!success,
        createdAt: new Date()
      });

      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to save score' }); }
  });

  //Returns all scores for highscores
  router.get('/', async (req, res) => {
    try {
      const allScores = await scores.find().sort({ createdAt: -1 }).toArray();
      res.json(allScores);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch scores' }); }
  });

  return router;
};