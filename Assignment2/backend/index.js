const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const MongoStore = require('connect-mongo');
const cors = require('cors');
const dbo = require('./conn.js');
const authRoutes = require('./routes/auth.js');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.ATLAS_URI,
    dbName: 'users',
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

dbo.connectToServer((err) => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }

  app.use('/api/auth', authRoutes(dbo));

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
});