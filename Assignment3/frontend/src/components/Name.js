import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Name() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const socket = useContext(SocketContext);

    const handleSubmit = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/players/register', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                alert(data.error || 'Failed to register');
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        socket.on('playersReady', (data) => {
            //console.log('playersReady received:', data); 
        });
        socket.on('gameStarted', (data) => {
            //console.log('gameStarted received: ', data);
            navigate('/select', {
                state: {
                    gameId: data.gameId,
                    player1: data.player1,
                    player2: data.player2,
                    wordSetter: data.wordSetter,
                    myName: name
                }
            });
        });

        return () => {
            socket.off('playersReady');
            socket.off('gameStarted');
        };
    }, [socket, navigate, name]);

    return (
        <div className="mainContainer">
            <header></header>
            <h1>Enter your name</h1>
            <div className="textBoxContainer">
                <input className="textBox" value={name} onChange={e => setName(e.target.value)} />
                <button onClick={handleSubmit} disabled={!name.trim()}>Join</button>
            </div>
        </div>
    );
}