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
  const socket = useContext(SocketContext);

  const { gameId, masked: initialMasked, myName, wordSetter } = location.state || {};

  const [masked, setMasked] = useState(initialMasked || '');
  const [guesses, setGuesses] = useState([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [maxWrong, setMaxWrong] = useState(6);

  const hangmanImages = [hangman0, hangman1, hangman2, hangman3, hangman4, hangman5, hangman6];

  //Submit a guess
  const makeGuess = async (letter) => {
    try {
      const res = await fetch('http://localhost:5000/api/games/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gameId, letter, playerName: myName })
      });
      if (!res.ok) throw new Error('Failed to submit guess');
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }

    socket.emit('joinGame', { gameId });

    const onGameUpdate = (data) => {
      if (data.gameId !== gameId) return;
      setMasked(data.masked);
      setGuesses(data.guesses || []);
      if (typeof data.wrongGuesses === 'number') setWrongCount(data.wrongGuesses);
      if (typeof data.maxWrong === 'number') setMaxWrong(data.maxWrong);
    };

    const onRoundEnded = (data) => {
      if (data.gameId !== gameId) return;
      navigate('/scores', {
        state: { betweenRounds: true, gameId, myName, nextWordSetter: data.nextWordSetter }
      });
    };

    const onGameCompleted = (data) => {
      if (data.gameId !== gameId) return;
      navigate('/scores', {
        state: { betweenRounds: false, gameId, myName }
      });
    };

    socket.on('gameUpdate', onGameUpdate);
    socket.on('roundEnded', onRoundEnded);
    socket.on('gameCompleted', onGameCompleted);

    return () => {
      socket.off('gameUpdate', onGameUpdate);
      socket.off('roundEnded', onRoundEnded);
      socket.off('gameCompleted', onGameCompleted);
    };
  }, [socket, navigate, gameId, myName]);

  //Choose image based on wrong guesses
  const imageIndex = Math.min(wrongCount, hangmanImages.length - 1);

  return (
    <div>
      <header>
        <h2>Player: {myName}</h2>
        <h3>Guesses: {wrongCount} / {maxWrong}</h3>
        <div className="usedLetters">
          <h3>Used Letters:</h3>
          <p>{guesses.join(', ') || 'No guesses yet'}</p>
        </div>
        <h3>
          {myName === wordSetter
            ? `Please wait for your opponent to guess your word`
            : `You are guessing ${wordSetter}'s word`}
        </h3>
      </header>
      <div className="gameContainer">
        <div className="keyboardContainer">
          <p className="wordToGuess">{masked}</p>
          <div className="keyboard">
            {'abcdefghijklmnopqrstuvwxyz'.split('').map(l => {
              const guessed = guesses.includes(l);
              const isCorrect = guessed && masked.toLowerCase().includes(l);
              return (
                <button
                  key={l}
                  onClick={() => makeGuess(l)}
                  disabled={guessed}
                  className={
                    guessed
                      ? isCorrect
                        ? 'correctGuess'
                        : 'wrongGuess'
                      : ''
                  }
                >{l}</button>
              );
            })}
          </div>
        </div>
        <div>
          <img
            className="hangmanImage"
            src={hangmanImages[imageIndex]}
            alt="hangman-img"
          />
        </div>
      </div>
    </div>
  );
}