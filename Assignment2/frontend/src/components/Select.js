import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Select() {
    const navigate = useNavigate();

    const goToAccount = (type) => {
        navigate('/account', { state: { accountType: type } });
    };

    return (
        <div>
            <header></header>
            <h1>Select Account</h1>
            <div class="accountContainer">
                <div class="accountBox">
                    <h2>Savings</h2>
                    <p>Current Balance:</p>
                    <button class="buttons" onClick={() => goToAccount('savings')}>Select</button>
                </div>
                <div class="accountBox">
                    <h2>Checking</h2>
                    <p>Current Balance:</p>
                    <button class="buttons" onClick={() => goToAccount('checking')}>Select</button>
                </div>
                <div class="accountBox">
                    <h2>Other</h2>
                    <p>Current Balance:</p>
                    <button class="buttons" onClick={() => goToAccount('other')}>Select</button>
                </div>
            </div>
        </div>
    );
}