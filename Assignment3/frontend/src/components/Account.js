import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedType = location.state?.accountType;

  const [accounts, setAccounts] = useState([]);

  // Helper to get label of selected account
  const getSelectedLabel = () => {
  const acc = accounts.find(a => a.type === selectedType);
  return acc?.label || selectedType;
};

  useEffect(() => {
    fetch('http://localhost:5000/api/accounts', {
      credentials: 'include'
    })
      .then(async res => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Fetch failed: ${text}`);
        }
        return res.json();
      })
      .then(data => setAccounts(data.accounts || []))
      .catch(err => {
        console.error('Error fetching accounts:', err.message);
      });
  }, [selectedType, navigate]);

  const handleLogout = async () => {
    const res = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) navigate('/login');
    else alert(data.error);
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div>
      <header></header>
      <div className="accountActionHeader">
        <h1>Selected Account: {getSelectedLabel() || 'None'}</h1>
        <h2>Current Balance: ${totalBalance.toLocaleString(undefined, 
          { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
      </div>
      {accounts.map((acc, i) => (
        <div
          key={i}
          style={{
            margin: '10px 0',
            padding: '10px',
            border: '1px solid #ccc',
            backgroundColor: acc.type === selectedType ? '#e0f7fa' : '#fff'
          }}
        >
          <strong>{acc.label}</strong> ({acc.type}) — ${acc.balance.toLocaleString(undefined, 
            { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ))}
      <h3>Choose an action:</h3>
      <div className="accountActions">
        <button className="buttons" onClick={() => navigate('/select')}>Back</button>
        <button className="buttons" onClick={() => navigate('/exchange')}>Deposit/Withdraw</button>
        <button className="buttons" onClick={() => navigate('/history')}>History</button>
        <button className="buttons" onClick={() => navigate('/transfer')}>Transfer</button>
        <button className="buttons" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
} 