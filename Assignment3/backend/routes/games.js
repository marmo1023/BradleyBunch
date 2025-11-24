const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (dbInstance, io) => {
  const router = express.Router();
  const games = dbInstance.getDb().collection('games');
  const scores = dbInstance.getDb().collection('scores');

  //Checks and Saves wordSetter's word
  router.post('/word', async (req, res) => {
    try {
      const { gameId, phrase, fromDatabase, playerName } = req.body;
      //Null check
      if (!gameId || !phrase) return res.status(400).json({ error: 'Missing required fields' });

      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      //Set wordSetter
      if (playerName && playerName !== game.wordSetter) {
        return res.status(403).json({ error: 'Only the word setter can submit the word' });
      }

      //Replaces the phrase with '_'
      const masked = phrase.replace(/[A-Za-z]/g, '_');

      //Initializes the game
      await games.updateOne(
        { _id: game._id },
        {
          $set: {
            phrase,
            masked,
            fromDatabase: !!fromDatabase,
            guesses: [],
            success: false
          }
        }
      );
      io.emit('wordSelected', { gameId, masked });

      res.json({ success: true, masked });
    } catch (err) { res.status(500).json({ error: 'Failed to submit word' }); }
  });

  //Player 2 guesses
  router.post('/guess', async (req, res) => {
    try {
      const { gameId, letter, playerName } = req.body;
      // Null check
      if (!gameId || !letter || !playerName) return res.status(400).json({ error: 'Missing required fields' });

      //Find Game
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      //Block wordSetter from guessing
      if (playerName === game.wordSetter) {
        return res.status(403).json({ error: 'Word setter cannot guess letters' });
      }

      //Log the guess
      const guesses = [... (game.guesses || []), letter.toLowerCase()];

      let masked = '';
      for (let i = 0; i < game.phrase.length; i++) {
        const char = game.phrase[i];
        if (/[A-Za-z]/.test(char) && guesses.includes(char.toLowerCase())) masked += char;
        else if (/[A-Za-z]/.test(char)) masked += '_';
        else masked += char;
      }
      const success = masked === game.phrase;

      //Updates the game
      await games.updateOne(
        { _id: game._id },
        { $set: { masked, guesses, success } }
      );
      io.emit('gameUpdate', { gameId, masked, guesses, success });

      //Saves score after round if game was won
      if (success) {
        const scoreDoc = {
          playerName,
          phrase: game.phrase,
          guesses,
          fromDatabase: !!game.fromDatabase,
          success,
          createdAt: new Date()
        };
        await scores.insertOne(scoreDoc);
        io.emit('roundEnded', { gameId, score: scoreDoc });

        //Change wordSetter
        const nextWordSetter = game.wordSetter === game.player1 ? game.player2 : game.player1;
        await games.updateOne(
          { _id: game._id },
          { $set: { wordSetter: nextWordSetter } }
        );

        //Ready for next round
        io.emit('nextRound', {
          gameId,
          nextWordSetter
        });
      }
      res.json({ success: true, masked, guesses, success });
    } catch (err) { res.status(500).json({ error: 'Failed to process guess' }); }
  });

  //Resets for new round
  router.post('/reset', async (req, res) => {
    try {
      await games.deleteMany({});
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to reset games' }); }
  });

  return router;
};