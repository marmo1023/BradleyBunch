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
            <div className="accountContainer">
                <div className="accountBox">
                    <h2>Savings</h2>
                    <p>Current Balance:</p>
                    <button className="buttons" onClick={() => goToAccount('savings')}>Select</button>
                </div>
                <div className="accountBox">
                    <h2>Checking</h2>
                    <p>Current Balance:</p>
                    <button className="buttons" onClick={() => goToAccount('checking')}>Select</button>
                </div>
                <div className="accountBox">
                    <h2>Other</h2>
                    <p>Current Balance:</p>
                    <button className="buttons" onClick={() => goToAccount('other')}>Select</button>
                </div>
            </div>
        </div>
    );
}