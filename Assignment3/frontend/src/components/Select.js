import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Select() {
  const [phrase, setPhrase] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useContext(SocketContext);

  const { gameId, wordSetter, myName } = location.state || {};

  //On-Click Event: submits word
  const submitWord = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/games/word', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          phrase,
          fromDatabase: false,
          playerName: myName
        })
      });
      const msg = await res.json();
      if (!res.ok) throw new Error(msg.error || 'Failed to submit word');
    } catch (err) { alert(err.message); }
  };

  //On-Click Event: submits random word from DB
  const submitRandomWord = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/games/word', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          phrase: '',
          fromDatabase: true,
          playerName: myName
        })
      });
      const msg = await res.json();
      if (!res.ok) throw new Error(msg.error || 'Failed to get random word');
    } catch (err) { alert(err.message); }
  };

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }
    //Join the game room
    socket.emit('joinGame', { gameId });

    //When word is selected, start game
    const onWordSelected = (data) => {
      console.log('wordSelected received', data);
      if (data.gameId !== gameId) return;
      navigate('/game', {
        state: {
          gameId: data.gameId,
          masked: data.masked,
          myName,
          wordSetter: data.wordSetter
        }
      });
    };
    // When backend signals next round, go back to Select with new setter
    const onNextRound = (data) => {
      if (data.gameId !== gameId) return;
      navigate('/select', {
        state: {
          gameId: data.gameId,
          wordSetter: data.nextWordSetter,
          myName
        }
      });
    };

    //Register listener
    socket.on('wordSelected', onWordSelected);
    socket.on('nextRound', onNextRound);

    //Cleanup listener
    return () => {
      socket.off('wordSelected', onWordSelected);
      socket.off('nextRound', onNextRound);
    };
  }, [socket, navigate, gameId, myName, wordSetter]);

  //UI Render
  if (myName === wordSetter) { //If current player is the word setter
    return (
      <div>
        <header></header>
        <h1>Please enter a word:</h1>
        <div className="textBoxContainer">
          <input
            className="textBox"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            placeholder="Type a word or phrase"
          />
          <button onClick={submitWord} disabled={!phrase.trim()}>Submit</button>
          <button onClick={submitRandomWord}>Use Random Word</button>
        </div>
      </div>
    );
  }
  return ( //If current player is not the word setter
    <div>
      <header></header>
      <h1 className="loading">Waiting for {wordSetter} to choose a word</h1>
    </div>
  );
}