import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Hangman() {
  const navigate = useNavigate();
  const location = useLocation();
  const [masked, setMasked] = useState(location.state?.masked || '');
  const [guesses, setGuesses] = useState([]);
  const socket = useContext(SocketContext);

  const { gameId, masked: initialMasked, myName } = location.state || {};

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
      <h2>Guess the word</h2>
      <p>{masked}</p>
      <div>
        {'abcdefghijklmnopqrstuvwxyz'.split('').map(l => (
          <button key={l} onClick={() => makeGuess(l)} disabled={guesses.includes(l)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}