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
            <header></header>
            <h1>Register</h1>

            <div class="loginBox">
                <div div class="container">
                    <label>Username:</label>
                    <input
                        class="textbox"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                <div div class="container">
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
                    <button class="buttons" onClick={handleRegister}>Submit</button>
                    <button class="buttons" onClick={() => navigate('/login')}>Return to Login</button>
                </div>

            </div>
        </div>
    );
}