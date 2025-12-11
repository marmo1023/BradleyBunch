import React, { useEffect, useState, useContext, useRef, computeCounts, initialState, state } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../socket';
import '../styles.css';

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
  const [waitingForSide, setWaitingForSide] = useState(false);

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
    socket.on('stateUpdate', (data) => {
      if (data.gameId !== gameId) return;
      const useSide = data.state?.doubleSignify?.useSide || [];
      setWaitingForSide(useSide.includes(myName));
    });
    return () => socket.off('stateUpdate');
  }, [socket, gameId, myName]);

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
      navigate('/history', { state: { gameId, myName } });
    };

    socket.on('stateUpdate', onStateUpdate);
    socket.on('gameComplete', onGameComplete);

    setCounts(computeCounts(state || initialState));

    return () => {
      socket.off('stateUpdate', onStateUpdate);
      socket.off('gameComplete', onGameComplete);
    };
  }, [socket, navigate, gameId, myName]);

  useEffect(() => {
    const useSide = state?.doubleSignify?.useSide || [];
    setWaitingForSide(useSide.includes(myName));
  }, [state, myName]);

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

  const theirName = Object.keys(state.players).find((n) => n !== myName);

  const handleToggleUseSide = async () => {
    try {
      if (!waitingForSide) {
        await fetch('http://localhost:5000/api/games/useSide', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, playerName: myName })
        });
        setWaitingForSide(true);
      } else {
        await fetch('http://localhost:5000/api/games/cancelUseSide', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, playerName: myName })
        });
        setWaitingForSide(false);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="game-board">
      <header>
        <h2>{mode === 'classic' ? 'Classic' : 'California'} Speed</h2>
        {countdown > 0 && <div className="countdown">Starting in {countdown}…</div>}
        {winner && <strong>Winner: {winner}</strong>}
      </header>
      {mode === 'classic' ? (
        <div className="classicBoard">
          <div className="opponentSidePile">
            <h4>{theirName}</h4>
            <img src="/images/back_dark.png"
              alt="Opponent Side Pile"
              className={`sidepile ${state.doubleSignify?.useSide?.includes(theirName) ? 'glow' : ''}`}
              style={{ cursor: 'default' }}
            />
          </div>
          <div onDragOver={allowDrop} onDrop={onDropTo('center.left')}>
            {state.center.left.length > 0 && (
              <img src={`/images/${state.center.left[state.center.left.length - 1].suit}_${state.center.left[state.center.left.length - 1].value}.png`}
                alt={`${state.center.left[state.center.left.length - 1].value} of ${state.center.left[state.center.left.length - 1].suit}`}
                draggable
                onDragStart={onDragStart(state.center.left[state.center.left.length - 1])}
                className="card"
              />
            )}
          </div>
          <div onDragOver={allowDrop} onDrop={onDropTo('center.right')}>
            {state.center.right.length > 0 && (
              <img src={`/images/${state.center.right[state.center.right.length - 1].suit}_${state.center.right[state.center.right.length - 1].value}.png`}
                alt={`${state.center.right[state.center.right.length - 1].value} of ${state.center.right[state.center.right.length - 1].suit}`}
                draggable
                onDragStart={onDragStart(state.center.right[state.center.right.length - 1])}
                className="card"
              />
            )}
          </div>
          <div>
            <h4>Request to Flip</h4>
            <img src="/images/back_light.png"
              alt="Your Side Pile"
              className={`sidepile ${waitingForSide ? 'glow' : ''}`}
              onClick={handleToggleUseSide}
            />
          </div>
        </div>
      ) : (
        <div className="californiaBoard">
          {state.piles.map((pile, idx) => (
            <div className="pile" key={idx} onDragOver={allowDrop} onDrop={onDropTo(`piles[${idx}]`)}>
              <h5>Pile {idx + 1}</h5>
              <div>
                {pile.length > 0 && (
                  <img
                    src={`/images/${pile[pile.length - 1].suit}_${pile[pile.length - 1].value}.png`}
                    alt={`${pile[pile.length - 1].value} of ${pile[pile.length - 1].suit}`}
                    draggable
                    onDragStart={onDragStart(pile[pile.length - 1])}
                    className="card"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <h4>Your Hand</h4>
      <div className="hand">
        {(state.players[myName]?.hand || []).map((c, i) => (
          <img
            key={`h-${i}`}
            src={`/images/${c.suit}_${c.value}.png`}
            alt={`${c.value} of ${c.suit}`}
            draggable
            onDragStart={onDragStart(c)}
            className="card"
          />
        ))}
      </div>
      <h4>Your Count: {counts.me}</h4>
      <h4>Their Count: {counts.them}</h4>
      <button onClick={async () => {
        const route = mode === 'classic' ? '/api/games/classicReset' : '/api/games/caliReset';
        await fetch(`http://localhost:5000${route}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId, playerName: myName })
        });
      }}>Stalemate</button>
    </div>
  );
}