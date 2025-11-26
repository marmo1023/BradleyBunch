import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../socket';

export default function Name() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const socket = useContext(SocketContext);

    //On-Click Event: register player with backend
    const handleSubmit = async () => {
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

    useEffect(() => {
        //Join room and navigate to select page
        socket.on('gameStarted', (data) => {
            socket.emit('joinGame', { gameId: data.gameId });
            navigate('/select', {
                state: {
                    gameId: data.gameId,
                    wordSetter: data.wordSetter,
                    myName: name
                }
            });
        });

        //Cleanup listener
        return () => {
            socket.off('gameStarted');
        };
    }, [socket, navigate, name]);

    //UI Render
    return (
        <div className="mainContainer">
            <header></header>
            <h1>Enter your name</h1>
            <div className="textBoxContainer">
                <input
                    className="textBox"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                />
                <button onClick={handleSubmit} disabled={!name.trim()}>Join</button>
            </div>
        </div>
    );
}