const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (dbInstance, io) => {
  const router = express.Router();
  const players = dbInstance.getDb().collection('players');
  const games = dbInstance.getDb().collection('games');

  // Register a player by name
  router.post('/register', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });

      //Reset if 2 or more players already exist
      const count = await players.countDocuments();
      if (count >= 2) {
        await players.deleteMany({});
      }

      //Insert new player
      const result = await players.insertOne({ name, createdAt: new Date() });
      req.session.playerName = name;

      const allPlayers = await players.find().toArray();
      console.log('Current players in DB:', allPlayers);

      if (allPlayers.length === 1) {
        //First player waits
        io.emit('waitingForSecond', { message: 'Waiting for second player...', player: name });
      }

      if (allPlayers.length === 2) {
        io.emit('playersReady', { ready: true, players: allPlayers });

        const game = await games.insertOne({
          player1: allPlayers[0].name,
          player2: allPlayers[1].name,
          wordSetter: allPlayers[0].name, // start with player1
          phrase: null,
          masked: null,
          guesses: [],
          fromDatabase: false,
          success: false,
          createdAt: new Date()
        });

        io.emit('gameStarted', {
          gameId: game.insertedId,
          player1: allPlayers[0].name,
          player2: allPlayers[1].name,
          wordSetter: allPlayers[0].name
        });
      }

      res.json({ success: true, playerId: result.insertedId, name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to register player' });
    }
  });

  // Reset players
  router.post('/reset', async (req, res) => {
    try {
      await players.deleteMany({});
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reset players' });
    }
  });

  return router;
};