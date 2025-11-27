import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SocketContext } from "../socket";

export default function Highscores() {
  const [scores, setScores] = useState([]);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const location = useLocation();
  const betweenRounds = location.state?.betweenRounds;
  const gameId = location.state?.gameId;
  const myName = location.state?.myName;

  useEffect(() => {
    //Fetch scores
    fetch('http://localhost:5000/api/scores')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setScores(sorted);
      })
      .catch(err => { alert(err.message); });
    
    //Update scores
    const onRoundEnded = (data) => {
      setScores(prev => {
        const updated = [data.score, ...prev];
        return updated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });
    };
    //Register listener
    socket.on('roundEnded', onRoundEnded);

    //Cleanup listener
    return () => socket.off('roundEnded', onRoundEnded);
  }, [socket]);

  //On-Click Event: reset everything and play again
  const handlePlayAgain = async () => {
    try {
      await fetch('/api/players/reset', { method: 'POST' });
      await fetch('/api/games/reset', { method: 'POST' });
      navigate('/');
    } catch (err) { alert(err.message); }
  };

  //On-Click Event: Round 2
  const handleRound2 = () => {
    navigate('/select', {
      state: {
        gameId,
        wordSetter: location.state?.nextWordSetter,
        myName
      }
    });
  };

  //UI Render
  return (
    <div>
      <header></header>
      <h2>High Scores</h2>
      <table className="scoresTable" border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phrase</th>
            <th>Total Guesses</th>
            <th>Incorrect Guesses</th>
            <th>Success</th>
            <th>Phrase Type</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s, i) => (
            <tr key={i}>
              <td>{s.playerName}</td>
              <td>{s.phrase}</td>
              <td>{s.totalGuesses ?? (s.guesses?.length || 0)}</td>
              <td>{s.incorrectGuesses ?? 0}</td>
              <td>{s.success ? 'Success' : 'Fail'}</td>
              <td>{s.fromDatabase ? 'Database' : 'Typed'}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {betweenRounds 
        ? (<button onClick={handleRound2}>Next Round</button>) 
        : (<button onClick={handlePlayAgain}>Play Again</button>)
      }
    </div>
  );
}