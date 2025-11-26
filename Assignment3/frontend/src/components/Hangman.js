import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../socket';

import hangman0 from './images/hangman-0.svg';
import hangman1 from './images/hangman-1.svg';
import hangman2 from './images/hangman-2.svg';
import hangman3 from './images/hangman-3.svg';
import hangman4 from './images/hangman-4.svg';
import hangman5 from './images/hangman-5.svg';
import hangman6 from './images/hangman-6.svg';

export default function Hangman() {
  const navigate = useNavigate();
  const location = useLocation();
  const [masked, setMasked] = useState(location.state?.masked || '');
  const [guesses, setGuesses] = useState([]);
  const [wrongGuesses, setWrongGuesses] = useState(0); // use this to keep track of how many incorrect guesses there have been
  const socket = useContext(SocketContext);

  const { gameId, masked: initialMasked, myName } = location.state || {};

  const hangmanImages = [hangman0, hangman1, hangman2, hangman3, hangman4, hangman5, hangman6];

  const makeGuess = async (letter) => {
    try {
      const res = await fetch('http://localhost:5000/api/games/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameId, letter, playerName: myName })
      });
      if (!res.ok) throw new Error('Failed to submit guess');

    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    const onGameUpdate = (data) => {
      if (data.gameId !== gameId) return;
      setMasked(data.masked);
      setGuesses(data.guesses);

      // we want to update the hangman image on an incorrect guess, so i'll implement it in the onGameUpdate
      if (data.wrongGuesses !== undefined) {
        setWrongGuesses(data.wrongGuesses);
      }
    };

    const onRoundEnded = (data) => {
      if (data.gameId !== gameId) return;
      navigate('/scores');
    };

    socket.on('gameUpdate', onGameUpdate);
    socket.on('roundEnded', onRoundEnded);

    return () => {
      socket.off('gameUpdate', onGameUpdate);
      socket.off('roundEnded', onRoundEnded);
    };
  }, [socket, navigate, gameId]);

  return (
    <div>
      <header></header>
      <h1>Guess The Word!</h1>
      <div className="gameContainer">

        <div className="keyboardContainer">

          <p className="wordToGuess">{masked}</p>
          <div className="keyboard">
            {'abcdefghijklmnopqrstuvwxyz'.split('').map(l => (
              <button key={l} onClick={() => makeGuess(l)} disabled={guesses.includes(l)}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <img className="hangmanImage" src={hangmanImages[wrongGuesses]} alt="hangman-img" height="auto" width="auto" />
        </div>
      </div>
    </div>
  );
}