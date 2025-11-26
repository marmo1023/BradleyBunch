const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (dbInstance, io) => {
  const router = express.Router();
  const games = dbInstance.getDb().collection('games');
  const scores = dbInstance.getDb().collection('scores');
  const phrases = dbInstance.getDb().collection('phrases');

  //Helper Function: changes string to lowercase
  const normalize = (s) => s.toLowerCase();

  //Helper Function: checks that ch is a letter
  const isAlpha = (ch) => /[a-z]/i.test(ch);

  //Helper Function: builds masked word
  const computeMasked = (phrase, guessesSet) => {
    return [...phrase].map(ch => {
      if (!isAlpha(ch)) return ch;
      return guessesSet.has(ch.toLowerCase()) ? ch : '_';
    }).join('');
  };

  //Helper Function: check if all letters are revealed
  const allAlphaRevealed = (phrase, guessesSet) => {
    return [...phrase].every(ch => !isAlpha(ch) || guessesSet.has(ch.toLowerCase()));
  };

  //Helper Function: picks a random phrase from DB
  const pickRandomPhrase = async () => {
    const [doc] = await phrases.aggregate([{ $sample: { size: 1 } }]).toArray();
    return doc?.text || null;
  };

  //Helper Function: builds a socket room
  const getRoom = (gameId) => `game:${gameId}`;

  //Route: wordSetter submits a word
router.post('/word', async (req, res) => {
  try {
    const { gameId, phrase, fromDatabase, playerName } = req.body;
    if (!gameId) return res.status(400).json({ error: 'Missing gameId' });

    const game = await games.findOne({ _id: new ObjectId(gameId) });
    if (!game) return res.status(404).json({ error: 'Game not found' });

    if (playerName && playerName !== game.wordSetter) {
      return res.status(403).json({ error: 'Only the word setter can submit the word' });
    }

    // Decide final phrase
    let finalPhrase = phrase;
    if (fromDatabase) {
      const randomPhrase = await pickRandomPhrase();
      if (!randomPhrase) return res.status(500).json({ error: 'No phrases available' });
      finalPhrase = randomPhrase;
    }
    if (!finalPhrase || !finalPhrase.trim()) {
      return res.status(400).json({ error: 'Phrase required' });
    }

    // Mask letters with "_"
    const masked = finalPhrase.replace(/[A-Za-z]/g, '_');

    // Initialize game
    await games.updateOne(
      { _id: game._id },
      {
        $set: {
          phrase: finalPhrase,
          masked,
          fromDatabase: !!fromDatabase,
          guesses: [],
          wrongGuesses: 0,
          maxWrong: game.maxWrong || 6,
          success: false,
          completed: false
        }
      }
    );

    // Debug log
    console.log('Emitting wordSelected globally:', { gameId, finalPhrase, masked });

    // Broadcast globally so both browsers definitely hear it
    io.emit('wordSelected', { gameId, masked, wordSetter: game.wordSetter });

    res.json({ success: true, masked });
  } catch (err) {
    console.error('Error in /word route:', err);
    res.status(500).json({ error: 'Failed to submit word' });
  }
});

  //Route: Guesser guesses a letter
  router.post('/guess', async (req, res) => {
    try {
      const { gameId, letter, playerName } = req.body;
      //Null check
      if (!gameId || !letter || !playerName) return res.status(400).json({ error: 'Missing required fields' });

      //Find the game
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      //Null check
      if (!game) return res.status(404).json({ error: 'Game not found' });

      //Block wordSetter from guessing
      if (playerName === game.wordSetter) return res.status(403).json({ error: 'Word setter cannot guess letters' });

      const l = letter.toLowerCase();
      const guesses = Array.isArray(game.guesses) ? [...game.guesses] : [];

      //Ignore duplicate guesses or finished game
      if (guesses.includes(l) || game.completed) {
        io.to(getRoom(gameId)).emit('gameUpdate', {
          gameId,
          masked: game.masked,
          guesses,
          success: game.success,
          wrongGuesses: game.wrongGuesses || 0,
          maxWrong: game.maxWrong || 6
        });
        return res.json({ success: true, masked: game.masked, guesses, success: game.success });
      }

      //Add guess to guesses list
      guesses.push(l);

      //Check if guess is correct
      const hasLetter = normalize(game.phrase).includes(l);
      let wrongGuesses = game.wrongGuesses || 0;
      if (!hasLetter) wrongGuesses += 1;

      //Update masked word and status
      const masked = computeMasked(game.phrase, new Set(guesses));
      const success = allAlphaRevealed(game.phrase, new Set(guesses));
      const failed = wrongGuesses >= (game.maxWrong || 6);
      const completed = success || failed;

      //Update game in DB
      await games.updateOne(
        { _id: game._id },
        { $set: { masked, guesses, success, wrongGuesses, completed } }
      );

      //Broadcast update
      io.to(getRoom(gameId)).emit('gameUpdate', {
        gameId, masked, guesses, success, wrongGuesses, maxWrong: game.maxWrong || 6
      });

      if (completed) {
        //Count incorrect guesses
        const incorrectGuesses = guesses.filter(
          g => !game.phrase.toLowerCase().includes(g)
        );
        //Save score
        const scoreDoc = {
          playerName,
          phrase: game.phrase,
          guesses,
          totalGuesses: guesses.length,
          incorrectGuesses: incorrectGuesses.length,
          fromDatabase: !!game.fromDatabase,
          success,
          createdAt: new Date(),
          gameId: gameId.toString(),
          roundNumber: game.roundNumber || 1
        };
        await scores.insertOne(scoreDoc);

        //Notify players round ended
        io.to(getRoom(gameId)).emit('roundEnded', { gameId, score: scoreDoc });

        //Switch wordSetter
        const nextWordSetter = game.wordSetter === game.player1 ? game.player2 : game.player1;
        const nextRound = (game.roundNumber || 1) + 1;

        //Update game
        await games.updateOne(
          { _id: game._id },
          {
            $set: {
              wordSetter: nextWordSetter,
              roundNumber: nextRound,
              phrase: null,
              masked: null,
              guesses: [],
              wrongGuesses: 0,
              success: false,
              completed: false,
              fromDatabase: false
            }
          }
        );
        //Notify players of next round or game completion
        if (nextRound > 2) {
          io.to(getRoom(gameId)).emit('gameCompleted', { gameId });
        } else {
          io.to(getRoom(gameId)).emit('nextRound', { gameId, nextWordSetter, roundNumber: nextRound });
        }
      }
      res.json({ success: true, masked, guesses, success, wrongGuesses, maxWrong: game.maxWrong || 6 });
    } catch (err) { res.status(500).json({ error: 'Failed to process guess' }); }
  });

  //Route: Reset all games
  router.post('/reset', async (req, res) => {
    try {
      await games.deleteMany({});
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to reset games' }); }
  });

  return router;
};