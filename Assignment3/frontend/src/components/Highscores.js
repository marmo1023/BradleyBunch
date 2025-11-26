import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../socket";

export default function Highscores() {
  const [scores, setScores] = useState([]);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/scores')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setScores(sorted);
      })
      .catch(console.error);

    const onRoundEnded = (data) => {
      setScores(prev => {
        const updated = [data.score, ...prev];
        return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    };

    socket.on('roundEnded', onRoundEnded);
    return () => socket.off('roundEnded', onRoundEnded);
  }, [socket]);

  const handlePlayAgain = async () => {
    try {
      await fetch('/api/players/reset', { method: 'POST' });
      await fetch('/api/games/reset', { method: 'POST' });
      navigate('/');
    } catch (err) { console.error(err); }
  };
  return (
    <div>
      <header></header>
      <h2>High Scores</h2>
      <table className="scoresTable" border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phrase</th>
            <th>Guesses</th>
            <th>Success</th>
            <th>Phrase Type</th>
            <th>Category</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i}>
              <td>{s.playerName}</td>
              <td>{s.phrase}</td>
              <td>{s.guesses?.length || 0}</td>
              <td>{s.success ? 'Success' : 'Fail'}</td>
              <td>{s.phraseType}</td>
              <td>{s.category}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handlePlayAgain}>Play Again</button>
    </div>
  );
}