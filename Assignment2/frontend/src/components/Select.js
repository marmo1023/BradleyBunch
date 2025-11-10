import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Select() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = React.useState([]);
    const [newLabel, setNewLabel] = React.useState('');
    const [error, setError] = React.useState('');
    const [showRename, setShowRename] = React.useState(false);

    const getLabel = (type) => {
        const acc = accounts.find(a => a.type === type);
        return acc?.label || type;
    };

    React.useEffect(() => {
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
    }, []);

    const goToAccount = (type) => {
        navigate('/account', { state: { accountType: type } });
    };

    const handleRename = async () => {
        if (!newLabel.trim()) {
            setError('Label cannot be empty');
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/accounts/rename', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountType: 'other', newLabel })
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (err) {
                throw new Error(`Invalid JSON response: ${text}`);
            }

            if (data.success) {
                setAccounts(prev =>
                    prev.map(acc => acc.type === 'other' ? { ...acc, label: newLabel } : acc)
                );
                setNewLabel('');
                setError('');
                setShowRename(false);
                alert('Account renamed');
            } else {
                setError(data.error || 'Rename failed');
            }
        } catch (err) {
            console.error('Rename error:', err.message);
            setError('Rename failed due to server error');
        }
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
                    <h2>{getLabel('other')}</h2>
                    <p>Current Balance:</p>
                    <button className="buttons" onClick={() => goToAccount('other')}>Select</button>
                    {!showRename ? (
                        <button
                            className="buttons"
                            style={{ marginTop: '10px' }}
                            onClick={() => setShowRename(true)}>Rename
                        </button>
                    ) : (
                        <div style={{ marginTop: '10px' }}>
                            <input
                                className="textbox"
                                type="text"
                                placeholder="New label"
                                value={newLabel}
                                onChange={e => setNewLabel(e.target.value)}
                            />
                            <button className="buttons" onClick={handleRename}>Submit</button>
                            <button className="buttons" onClick={() => setShowRename(false)}>Cancel</button>
                            {error && <p style={{ color: 'red' }}>{error}</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}