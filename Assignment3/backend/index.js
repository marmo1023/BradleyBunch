const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const MongoStore = require('connect-mongo');
const cors = require('cors');
const dbo = require('./conn.js');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true
}));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.ATLAS_URI,
    dbName: 'banking',
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// Connect to DB and register routes
dbo.connectToServer((err) => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('MongoDB connected. Registering routes...');

  app.use('/api/auth', require('./routes/auth.js')(dbo));
  app.use('/api/accounts', require('./routes/accounts.js')(dbo));
  app.use('/api/transfers', require('./routes/transfers.js')(dbo));
  app.use('/api/transactions', require('./routes/transactions.js')(dbo));
  app.use('/api/categories', require('./routes/categories.js')(dbo)); // added

  app.listen(port, () => { console.log(`Server running on http://localhost:${port}`); });
});