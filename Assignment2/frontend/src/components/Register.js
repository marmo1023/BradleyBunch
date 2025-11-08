import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) navigate('/select');
        else alert(data.error);
    };

    return (
        <div>
            <h2>Register</h2>

            <label>Username:</label>
            <input
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
            />

            <label>Password:</label>
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />

            <button onClick={handleRegister}>Register</button>
            <button onClick={() => navigate('/login')}>Cancel</button>
        </div>
    );
}