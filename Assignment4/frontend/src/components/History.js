import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SocketContext } from "../socket";

export default function History() {
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const location = useLocation();
  const myName = location.state?.myName;
  const [scores, setScores] = useState([]);

  useEffect(() => {
    if (!myName) return;
    fetch(`http://localhost:5000/api/scores/${myName}`)
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setScores(sorted);
      })
      .catch(err => { alert(err.message); });
    const onGameComplete = (data) => {
    };
    socket.on('gameComplete', onGameComplete);
    return () => socket.off('gameComplete', onGameComplete);
  }, [socket, myName]);

  return (
    <div className="mainContainer">
      <header>
        <h2>Previous Games for {myName}</h2>
      </header>
      {scores.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '1.2rem', marginTop: '40px' }}>
          No wins yet, keep playing!
        </div>
      ) : (
        <table className="historyTable">
          <thead>
            <tr>
              <th>Winner</th>
              <th>Result</th>
              <th>Opponent Cards Left</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((s, i) => (
              <tr key={i}>
                <td>{s.playerName}</td>
                <td style={{ color: s.outcome === 'win' ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                  {s.outcome === 'win' ? '✓ Won' : '✗ Lost'}
                </td>
                <td>{s.losingCardsRemaining}</td>
                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button onClick={() => navigate('/')}>← Play Again</button>
      </div>
    </div>
  );
}