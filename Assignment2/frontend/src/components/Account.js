import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedType = location.state?.accountType;

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/accounts', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setAccounts(data.accounts || []));
  }, []);

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
      <h2>Current Balance: ${totalBalance.toFixed(2)}</h2>

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
          <strong>{acc.label}</strong> ({acc.type}) — ${acc.balance.toFixed(2)}
        </div>
      ))}

      <button onClick={() => navigate('/exchange')}>Deposit/Withdraw</button>
      <button onClick={() => navigate('/history')}>History</button>
      <button onClick={() => navigate('/transfer')}>Transfer</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}