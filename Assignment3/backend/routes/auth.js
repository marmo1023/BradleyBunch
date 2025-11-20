const express = require('express');
const crypto = require('crypto');

//Hashes password with salt
function hashPassword(password, salt) { return crypto.createHash('sha256').update(password + salt).digest('hex'); }

module.exports = (dbInstance) => {
  const router = express.Router();
  const users = dbInstance.getDb().collection('users');
  const accounts = dbInstance.getDb().collection('accounts');

  // Register
  router.post('/register', async (req, res) => {
    try {
      const { username, password } = req.body;

      //Null check
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      //Check if user exists
      const existing = await users.findOne({ username });
      if (existing) return res.status(400).json({ error: 'User exists' });

      //Set password
      const salt = crypto.randomBytes(16).toString('hex');
      const hashed = hashPassword(password, salt);

      //Create user
      const result = await users.insertOne({ username, salt, password: hashed });
      const user = result.insertedId;

      //Create default accounts for user
      await accounts.insertOne({
        userId: user,
        accounts: [
          { type: 'checking', label: 'Checking', balance: 0 },
          { type: 'savings', label: 'Savings', balance: 0 },
          { type: 'other', label: 'Other', balance: 0 }
        ]
      });

      //Login after registration
      req.session.username = username;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Registration failed' }); }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      //Null check
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

      //Check credentials
      const user = await users.findOne({ username });
      if (!user) return res.status(400).json({ error: 'Invalid credentials' });

      //Verify password
      const hashed = hashPassword(password, user.salt);
      if (hashed !== user.password) return res.status(400).json({ error: 'Invalid credentials' });

      //Login user
      req.session.username = username;
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Login failed' }); }
  });

  // Logout
  router.post('/logout', (req, res) => {
    try {
      //Closes session
      req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.clearCookie('connect.sid');
        res.json({ success: true });
      });
    } catch (err) { res.status(500).json({ error: 'Logout failed' }); }
  });

  // Account
  router.get('/account', (req, res) => {
    try {
      if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
      res.json({ username: req.session.username });
    } catch (err) { res.status(500).json({ error: 'Failed to retrieve account' }); }
  });
  return router;
};