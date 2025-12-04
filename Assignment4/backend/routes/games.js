const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (dbInstance, io) => {
  const router = express.Router();
  const games = dbInstance.getDb().collection('games');
  const scores = dbInstance.getDb().collection('scores');
  const getRoom = (gameId) => `game:${gameId}`;

  //Helper: Creates a new deck of cards
  const generateDeck = () => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    return deck;
  };

  //Helper: Shuffles the deck of cards
  const shuffle = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  };

  //Helper: Checks if the deck and hand are empty
  const playerEmpty = (playerState) => {
    return playerState.deck.length === 0 && playerState.hand.length === 0;
  };

  //Helper: Checks for a winner
  const checkWinner = (state, player1, player2) => {
    if (playerEmpty(state.players[player1])) return player1;
    if (playerEmpty(state.players[player2])) return player2;
    return null;
  };

  //Route: Starts the game
  router.post('/start', async (req, res) => {
    try {
      const { gameId, mode } = req.body;
      if (!gameId || !mode) return res.status(400).json({ error: 'Missing gameId or mode' });
      //Null check
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      //Shuffle a new deck
      const deck = shuffle(generateDeck());

      let state;
      //Classic: 2 center face-up piles, 2 side face-down piles (5 each)
      if (mode === 'classic') {
        state = {
          center: { left: [deck.pop()], right: [deck.pop()] },
          side: { left: deck.splice(0, 5), right: deck.splice(0, 5) },
          players: {
            [game.player1]: { deck: deck.splice(0, 20), hand: [] },
            [game.player2]: { deck: deck.splice(0, 20), hand: [] }
          },
          doubleSignify: { useSide: [], stalemate: [] }
        };
      } 
      //California: 8 piles (4 per player), split deck between players
      else {
        const piles = [];
        for (let i = 0; i < 8; i++) piles.push([deck.pop()]);
        state = {
          piles,
          players: {
            [game.player1]: { deck: deck.splice(0, 22), hand: [] },
            [game.player2]: { deck: deck.splice(0, 22), hand: [] }
          }
        };
      }
      //Updates game state in DB
      await games.updateOne(
        { _id: game._id },
        { $set: { state, mode, completed: false, winner: null } }
      );

      //Broadcasts game start to players
      io.to(getRoom(gameId)).emit('gameStarted', { gameId, mode, state });
      res.json({ success: true, state });
    } catch (err) { res.status(500).json({ error: 'Failed to start game' }); }
  });

  //Route: Moves a card
  router.post('/move', async (req, res) => {
    try {
      const { gameId, playerName, card, targetPile } = req.body;
      if (!gameId || !playerName || !card || !targetPile) return res.status(400).json({ error: 'Missing required fields' });
      //Null check
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      const state = game.state;
      //Resolves target pile to actual array
      let target = null;
      if (typeof targetPile === 'string') {
        if (targetPile === 'center.left' && state.center?.left) target = state.center.left;
        else if (targetPile === 'center.right' && state.center?.right) target = state.center.right;
        else if (targetPile.startsWith('piles[') && Array.isArray(state.piles)) {
          const m = targetPile.match(/\d+/);
          if (m) target = state.piles[parseInt(m[0], 10)] || null;
        }
      }
      if (!target) return res.status(400).json({ error: 'Invalid target pile' });

      //Check if the move is valid
      const toRank = (val) => (val === 'A' ? 1 : val === 'J' ? 11 : val === 'Q' ? 12 : val === 'K' ? 13 : parseInt(val, 10));
      const adjacent = (r1, r2) => {
        const diff = Math.abs(r1 - r2);
        return diff === 1 || diff === 12;
      };
      if (target.length === 0) return res.status(400).json({ error: 'Illegal move' });

      const top = target[target.length - 1];
      if (!adjacent(toRank(card.value), toRank(top.value))) {
        return res.status(400).json({ error: 'Illegal move' });
      }

      //Remove the card from player's hand/deck
      const p = state.players[playerName];
      if (!p) return res.status(400).json({ error: 'Unknown player' });
      const sameCard = (c) => c.suit === card.suit && c.value === card.value;
      let removed = false;
      let idx = p.hand.findIndex(sameCard);
      if (idx >= 0) {
        p.hand.splice(idx, 1);
        removed = true;
      } else {
        idx = p.deck.findIndex(sameCard);
        if (idx >= 0) {
          p.deck.splice(idx, 1);
          removed = true;
        }
      }
      if (!removed) return res.status(400).json({ error: 'Card not found in player state' });

      //Apply move
      target.push(card);

      //Check for winner
      const winner = checkWinner(state, game.player1, game.player2);

      //Update game state in DB
      await games.updateOne(
        { _id: game._id },
        { $set: { state, winner, completed: !!winner } }
      );

      //Broadcast state update
      io.to(getRoom(gameId)).emit('stateUpdate', { gameId, state, winner });

      //Record winner in scores collection
      if (winner) {
        const loser = winner === game.player1 ? game.player2 : game.player1;
        const losingState = state.players[loser];
        const losingCardsRemaining = (losingState.deck.length || 0) + (losingState.hand.length || 0);
        const resultDoc = {
          playerName: winner,
          outcome: 'win',
          losingCardsRemaining,
          gameId: game._id.toString(),
          createdAt: new Date()
        };

        //Add new score with game outcome
        await scores.insertOne(resultDoc);
        io.to(getRoom(gameId)).emit('gameComplete', { gameId, winner, result: resultDoc });
      }
      res.json({ success: true, state, winner });
    } catch (err) { res.status(500).json({ error: 'Failed to move card' }); }
  });

  //Route: Classic Speed, both players signify using one card from each side pile
  router.post('/useSide', async (req, res) => {
    try {
      const { gameId, playerName } = req.body;
      if (!gameId || !playerName) return res.status(400).json({ error: 'Missing gameId or playerName' });
      //Null check
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      const state = game.state;
      //Record player's signify
      if (!state.doubleSignify.useSide.includes(playerName)) state.doubleSignify.useSide.push(playerName);

      //Move one card from each side pile to center piles
      if (state.doubleSignify.useSide.length === 2) {
        if (state.side.left.length) state.center.left.push(state.side.left.pop());
        if (state.side.right.length) state.center.right.push(state.side.right.pop());
        state.doubleSignify.useSide = [];
      }

      //Check for winner
      const winner = checkWinner(state, game.player1, game.player2);

      //Update game state in DB
      await games.updateOne({ _id: game._id }, { $set: { state, winner, completed: !!winner } });

      //Broadcast state update
      io.to(getRoom(gameId)).emit('stateUpdate', { gameId, state, winner });

      //Broadcast game complete if there is a winner
      if (winner) io.to(getRoom(gameId)).emit('gameComplete', { gameId, winner });

      res.json({ success: true, state, winner });
    } catch (err) { res.status(500).json({ error: 'Failed to use side piles' }); }
  });

  //Route: Classic Stalemate, reset piles
  router.post('/classicReset', async (req, res) => {
    try {
      const { gameId, playerName } = req.body;
      if (!gameId || !playerName) return res.status(400).json({ error: 'Missing gameId or playerName' });
      //Null check
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      const state = game.state;
      if (!state.doubleSignify.stalemate.includes(playerName)) state.doubleSignify.stalemate.push(playerName);
      const sidesEmpty = !state.side.left.length && !state.side.right.length;

      //Reshuffle center piles into side piles for stalemate
      if (state.doubleSignify.stalemate.length === 2 && sidesEmpty) {
        const reshufflePile = [...state.center.left, ...state.center.right];
        shuffle(reshufflePile);
        state.side.left = reshufflePile.splice(0, 5);
        state.center.left = reshufflePile.splice(0, 1);
        state.center.right = reshufflePile.splice(0, 1);
        state.side.right = reshufflePile.splice(0, 5);
        state.doubleSignify.stalemate = [];
      }
      //Check for winner
      const winner = checkWinner(state, game.player1, game.player2);

      //Update game state in DB
      await games.updateOne({ _id: game._id }, { $set: { state, winner, completed: !!winner } });

      //Broadcast state update
      io.to(getRoom(gameId)).emit('stateUpdate', { gameId, state, winner });

      //Broadcast game complete if there is a winner
      if (winner) io.to(getRoom(gameId)).emit('gameComplete', { gameId, winner });

      res.json({ success: true, state, winner });
    } catch (err) { res.status(500).json({ error: 'Failed to reset stalemate' }); }
  });

  //Route: California Stalemate, reset piles
  router.post('/caliReset', async (req, res) => {
    try {
      const { gameId } = req.body;
      if (!gameId) return res.status(400).json({ error: 'Missing gameId' });
      //Null check
      const game = await games.findOne({ _id: new ObjectId(gameId) });
      if (!game) return res.status(404).json({ error: 'Game not found' });

      const state = game.state;
      if (!state.piles || state.piles.length !== 8) return res.status(400).json({ error: 'Not in California mode or invalid piles' });

      //Each side takes their 4 piles and shuffles back into their decks
      const p1Piles = state.piles.slice(0, 4).flat();
      const p2Piles = state.piles.slice(4, 8).flat();

      state.players[game.player1].deck = shuffle([
        ...state.players[game.player1].deck,
        ...p1Piles
      ]);
      state.players[game.player2].deck = shuffle([
        ...state.players[game.player2].deck,
        ...p2Piles
      ]);

      //Redeal 4 new piles each (8 total)
      const newPiles = [];
      for (const pid of [game.player1, game.player2]) {
        for (let i = 0; i < 4; i++) {
          const pile = [];
          if (state.players[pid].deck.length) {
            pile.push(state.players[pid].deck.pop());
          }
          newPiles.push(pile);
        }
      }
      state.piles = newPiles;

      //Check for winner
      const winner = checkWinner(state, game.player1, game.player2);

      //Update game state in DB
      await games.updateOne({ _id: game._id }, { $set: { state, winner, completed: !!winner } });

      //Broadcast state update
      io.to(getRoom(gameId)).emit('stateUpdate', { gameId, state, winner });

      //Broadcast game complete if there is a winner
      if (winner) io.to(getRoom(gameId)).emit('gameComplete', { gameId, winner });

      res.json({ success: true, state, winner });
    } catch (err) { res.status(500).json({ error: 'Failed to reset California mode' }); }
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