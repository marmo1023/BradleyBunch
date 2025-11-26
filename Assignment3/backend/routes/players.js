const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (dbInstance, io) => {
  const router = express.Router();
  const players = dbInstance.getDb().collection('players');
  const games = dbInstance.getDb().collection('games');

  //Route: Register a new player by name
  router.post('/register', async (req, res) => {
    try {
      const { name } = req.body;
      //Null check
      if (!name) return res.status(400).json({ error: 'Name required' });

      //Reset players if there are already 2 or more
      const count = await players.countDocuments();
      if (count >= 2) await players.deleteMany({});

      //Add new player to DB
      const result = await players.insertOne({ name, createdAt: new Date() });

      //Save player name in session
      req.session.playerName = name;

      //Get all current players
      const allPlayers = await players.find().toArray();
      console.log('Current players in DB:', allPlayers);

      //Wait for second player if only one present
      if (allPlayers.length === 1) {
        io.emit('waitingForSecond', {
          message: 'Waiting for second player...',
          player: name
        });
      }

      //Start Game when 2 players are present
      if (allPlayers.length === 2) {
        io.emit('playersReady', { ready: true, players: allPlayers });

        //Initialize new game
        const gameDoc = {
          player1: allPlayers[0].name,
          player2: allPlayers[1].name,
          wordSetter: allPlayers[0].name,
          roundNumber: 1,
          phrase: null,
          masked: null,
          guesses: [],
          fromDatabase: false,
          wrongGuesses: 0,
          maxWrong: 6,
          success: false,
          completed: false,
          createdAt: new Date()
        };

        //Save game in DB
        const game = await games.insertOne(gameDoc);

        //Notify both players the game has started
        io.emit('gameStarted', {
          gameId: game.insertedId.toString(),
          player1: gameDoc.player1,
          player2: gameDoc.player2,
          wordSetter: gameDoc.wordSetter,
          roundNumber: gameDoc.roundNumber
        });
      }
      res.json({ success: true, playerId: result.insertedId, name });
    } catch (err) { res.status(500).json({ error: 'Failed to register player' }); }
  });

  //Route: Reset all players
  router.post('/reset', async (req, res) => {
    try {
      await players.deleteMany({});
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to reset players' }); }
  });

  return router;
};