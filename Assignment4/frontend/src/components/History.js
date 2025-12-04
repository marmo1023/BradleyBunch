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
    fetch(`http://localhost:5000/api/scores/:${myName}`)
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
    <div>
      <header>
        <h2>Previous Games for {myName}</h2>
      </header>
      <table className="historyTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Outcome</th>
            <th>Loser's Remaining Card Count</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i}>
              <td>{s.playerName}</td>
              <td>{s.outcome}</td>
              <td>{s.losingCardsRemaining}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/')}>Play again</button>
    </div>
  );
}