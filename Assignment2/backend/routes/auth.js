const express = require('express');
const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

module.exports = (dbInstance) => {
  const users = dbInstance.getDb().collection('users');
  const router = express.Router();

  // Register
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existing = await users.findOne({ username });
    if (existing) return res.status(400).json({ error: 'User exists' });
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hashed = hashPassword(password, salt);

    await users.insertOne({ username, salt, password: hashed });
    req.session.username = username;
    res.json({ success: true });
  });

  // Login
  router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await users.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const hashed = hashPassword(password, user.salt);
    if (hashed !== user.password) return res.status(400).json({ error: 'Invalid credentials' });

    req.session.username = username;
    res.json({ success: true });
  });

  // Logout
  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
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