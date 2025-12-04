import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Game() {
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useContext(SocketContext);

  const { gameId, myName, mode, endsAt, initialState } = location.state || {};
  const [state, setState] = useState(initialState || null);
  const [winner, setWinner] = useState(null);
  const [counts, setCounts] = useState({ me: 0, them: 0 });
  const countdownRef = useRef(null);
  const [countdown, setCountdown] = useState(0);

  const computeCounts = (s) => {
    if (!s || !s.players) return { me: 0, them: 0 };
    const me = (s.players[myName]?.deck?.length || 0) + (s.players[myName]?.hand?.length || 0);
    const theirName = Object.keys(s.players).find((n) => n !== myName);
    const them = (s.players[theirName]?.deck?.length || 0) + (s.players[theirName]?.hand?.length || 0);
    return { me, them };
  };

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const ms = Math.max(0, endsAt - Date.now());
      setCountdown(Math.ceil(ms / 1000));
      if (ms <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    };
    countdownRef.current = setInterval(tick, 100);
    tick();
    return () => countdownRef.current && clearInterval(countdownRef.current);
  }, [endsAt]);

  useEffect(() => {
    if (!gameId) {
      navigate('/');
      return;
    }
    socket.emit('joinGame', { gameId });

    const onStateUpdate = (data) => {
      if (data.gameId !== gameId) return;
      setState(data.state);
      setWinner(data.winner || null);
      setCounts(computeCounts(data.state));
    };
    const onGameComplete = (data) => {
      if (data.gameId !== gameId) return;
      setWinner(data.winner);
      setState((prev) => prev);

      const promptName = window.prompt('Enter your name to record the result:', myName || '');
      if (promptName) navigate('/history', { state: { gameId, myName: promptName } });
      else navigate('/history', { state: { gameId, myName } });
    };
    socket.on('stateUpdate', onStateUpdate);
    socket.on('gameComplete', onGameComplete);

    setCounts(computeCounts(state || initialState));

    return () => {
      socket.off('stateUpdate', onStateUpdate);
      socket.off('gameComplete', onGameComplete);
    };
  }, [socket, navigate, gameId, myName]);

  const onDragStart = (card) => (e) => {
    if (countdown > 0 || winner) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/json', JSON.stringify(card));
  };

  const onDropTo = (targetKey) => async (e) => {
    e.preventDefault();
    try {
      const card = JSON.parse(e.dataTransfer.getData('application/json'));
      const res = await fetch('http://localhost:5000/api/games/move', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerName: myName, card, targetPile: targetKey })
      });
      const msg = await res.json();
      if (!res.ok) throw new Error(msg.error || 'Move rejected');
    } catch (err) { alert(err.message); }
  };
  const allowDrop = (e) => e.preventDefault();

  if (!state) return <div>Loading…</div>;
  const ClassicBoard = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div onDragOver={allowDrop} onDrop={onDropTo('center.left')}>
        <h4>Left</h4>
        <div>{state.center.left.map((c, i) => <span key={i}>{c.value} - {c.suit} </span>)}</div>
      </div>
      <div onDragOver={allowDrop} onDrop={onDropTo('center.right')}>
        <h4>Right</h4>
        <div>{state.center.right.map((c, i) => <span key={i}>{c.value} - {c.suit} </span>)}</div>
      </div>
      <div>
        <h4>Your Card Count: {counts.me}</h4>
        <div>
          {(state.players[myName]?.hand || []).map((c, i) => (
            <button key={`h-${i}`} draggable onDragStart={onDragStart(c)}>{c.value} - {c.suit} </button>
          ))}
          {(state.players[myName]?.deck || []).slice(-3).map((c, i) => (
            <button key={`d-${i}`} draggable onDragStart={onDragStart(c)}>{c.value} - {c.suit}  </button>
          ))}
        </div>
      </div>
      <div style={{ gridColumn: '1 / -1'}}>
        <h4>Their Card Count: {counts.them}</h4>
      </div>
      <div>
        <button
          onClick={async () => {
            await fetch('http://localhost:5000/api/games/useSide', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId, playerName: myName })
            });
          }}
        >Side Pile
        </button>
        <button onClick={async () => {
            await fetch('http://localhost:5000/api/games/stalemate', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId, playerName: myName })
            });
          }}
        >Stalemate
        </button>
      </div>
    </div>
  );
  const CaliforniaBoard = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {state.piles.map((pile, idx) => (
        <div onDragOver={allowDrop}
          key={idx}
          onDrop={onDropTo(`piles[${idx}]`)}
          style={{ border: '2px dashed', padding: 8 }}
        >
          <h5>Pile {idx + 1}</h5>
          <div>{pile.map((c, i) => <span key={i}>{c.value} - {c.suit}</span>)}</div>
        </div>
      ))}
      <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
        <h4>Your Card Count: {counts.me}</h4>
        <div>
          {(state.players[myName]?.hand || []).map((c, i) => (
            <button key={`h-${i}`} draggable onDragStart={onDragStart(c)}>{c.value} - {c.suit} </button>
          ))}
          {(state.players[myName]?.deck || []).slice(-3).map((c, i) => (
            <button key={`d-${i}`} draggable onDragStart={onDragStart(c)}>{c.value} - {c.suit} </button>
          ))}
        </div>
        <button onClick={async () => {
            await fetch('http://localhost:5000/api/games/californiaReset', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gameId })
            });
          }}
        >Stalemate
        </button>
      </div>
    </div>
  );
  return (
    <div>
      <header>
        <h2>{mode === 'classic' ? 'Classic' : 'California'} Speed</h2>
        {winner && <strong>Winner: {winner}</strong>}
      </header>
      {mode === 'classic' ? <ClassicBoard /> : <CaliforniaBoard />}
    </div>
  );
}