import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Start() {
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const [name, setName] = useState('');
  const [gameId, setGameId] = useState(null);
  const [players, setPlayers] = useState([]);
  const [mode, setMode] = useState('classic');

  const handleModeChange = (newMode) => {
    setMode(newMode);
    socket.emit('modeChanged', { gameId, mode: newMode });
  };

  useEffect(() => {
    const onModeChanged = (data) => {
      if (data.gameId !== gameId) return;
      setMode(data.mode);
    };
    socket.on('modeChanged', onModeChanged);
    return () => socket.off('modeChanged', onModeChanged);
  }, [socket, gameId]);

  const handleRegister = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/players/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to register player');
    } catch (err) { alert(err.message); }
  };

  const handleStartGame = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/games/start', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, mode })
      });
      const msg = await res.json();
      if (!res.ok) throw new Error(msg.error || 'Failed to start game');
    } catch (err) { alert(err.message); }
  };

  useEffect(() => {
    const onGameStarted = (data) => {
      setGameId(data.gameId);
      setPlayers([data.player1, data.player2]);
      socket.emit('joinGame', { gameId: data.gameId });
    };

    const onGameStartedWithState = (data) => {
      if (data.gameId !== gameId) return;
      const endsAt = Date.now() + 3000;
      navigate('/game', {
        state: {
          gameId: data.gameId,
          myName: name,
          mode: data.mode,
          endsAt,
          initialState: data.state
        }
      });
    };
    socket.on('gameStarted', onGameStarted);
    socket.on('gameStarted', onGameStartedWithState);
    return () => {
      socket.off('gameStarted', onGameStarted);
      socket.off('gameStarted', onGameStartedWithState);
    };
  }, [socket, navigate, name, gameId]);

  return (
    <div className="mainContainer">
      <h1>Enter your Name:</h1>
      <div className="organizer">
        <input className='textbox' value={name} onChange={(e) => setName(e.target.value)} />
        <button onClick={handleRegister} disabled={!name.trim()}>Join</button>
      </div>
      {players.length === 2 && (
        <div>
          <h3>Select Game Type:</h3>
          <label>
            <input
              type="radio"
              name="mode"
              value="classic"
              checked={mode === 'classic'}
              onChange={() => handleModeChange('classic')}
            />Classic Speed
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              value="california"
              checked={mode === 'california'}
              onChange={() => handleModeChange('california')}
            />California Speed
          </label>
          <div>
            <button onClick={handleStartGame}>Start Game</button>
          </div>
        </div>
      )}
    </div>
  );
}