const express = require('express');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

module.exports = (dbInstance) => {
  const users = dbInstance.getDb().collection('users');
  const accounts = dbInstance.getDb().collection('accounts');
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const existing = await users.findOne({ username });
    if (existing) return res.status(400).json({ error: 'User exists' });

    const salt = crypto.randomBytes(16).toString('hex');
    const hashed = hashPassword(password, salt);

    const result = await users.insertOne({ username, salt, password: hashed });
    const user = result.insertedId;

    await accounts.insertOne({
      userId: user,
      accounts: [
        { type: 'checking', label: 'Checking', balance: 0 },
        { type: 'savings', label: 'Savings', balance: 0 },
        { type: 'other', label: 'Other', balance: 0 }
      ]
    });
    req.session.username = username;
    res.json({ success: true });
  });

  // Login
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = await users.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const hashed = hashPassword(password, user.salt);
    if (hashed !== user.password) return res.status(400).json({ error: 'Invalid credentials' });

    req.session.username = username;
    res.json({ success: true });
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });

  // Account
  router.get('/account', (req, res) => {
    if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
    res.json({ username: req.session.username });
  });

  return router;
};