import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
dotenv.config();
import MongoStore from 'connect-mongo';
import cors from 'cors';
import { connectToServer, getDb } from './conn.js';

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

connectToServer();

app.listen(port, () => {
  dbo.connectToServer((err) => {
    if (err) {
      console.error('DB connection error:', err);
      process.exit(1);
    }
    const authRoutes = require('./routes/auth.js')(dbo);
    app.use('/api/auth', authRoutes);
    console.log(`Server running on port ${port}`);
  });
});