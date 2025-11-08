import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        const res = await fetch('http://localhost:5000/api/auth/login', {
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
            <header></header>
            <h1>Login</h1>
            <div class="loginBox">
                <div class="container">
                    <label>Username:</label>
                    <input
                        class="textbox"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                <div class="container">
                    <label>Password:</label>
                    <input
                        class="textbox"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <div class="container">
                    <button class="buttons" onClick={handleLogin}>Login</button>
                    <button class="buttons" onClick={() => navigate('/register')}>Register</button>
                </div>
            </div>
        </div>
    );
}