import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Select() {
    const [phrase, setPhrase] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const socket = useContext(SocketContext);

    const { gameId, player1, player2, wordSetter, myName } = location.state || {};

    const submitWord = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/games/word', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, phrase, fromDatabase: false, playerName: myName })
            });
            if (!res.ok) {
                const msg = await res.json();
                throw new Error(msg.error || 'Failed to submit word');
            }
        } catch (err) { alert(err.message); }
    };

    useEffect(() => {
        const onWordSelected = (data) => {
            if (data.gameId !== gameId) return;
            navigate('/game', { state: { 
                gameId: data.gameId, 
                masked: data.masked,
                myName
            } });
        };
        socket.on('wordSelected', onWordSelected);
        return () => socket.off('wordSelected', onWordSelected);
    }, [socket, navigate, gameId]);

    if (myName === wordSetter) {
        return (
            <div>
                <h2>Please enter a word:</h2>
                <input value={phrase} onChange={e => setPhrase(e.target.value)} />
                <button onClick={submitWord} disabled={!phrase.trim()}>Submit</button>
            </div>
        );
    }

    return (
        <div>
            <h2>Waiting for {wordSetter} to choose a word...</h2>
        </div>
    );
}
