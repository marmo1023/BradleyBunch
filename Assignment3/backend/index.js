const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const http = require('http');
const { Server } = require('socket.io');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const dbo = require('./conn.js');

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

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
    dbName: 'hangman',
    collectionName: 'sessions'
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

//Connect to DB
dbo.connectToServer(async (err) => {
  if (err) {
    console.error('DB connection error:', err);
    process.exit(1);
  }
  console.log('MongoDB connected. Registering routes...');

  // Routes
  app.use('/api/players', require('./routes/players.js')(dbo, io));
  app.use('/api/games', require('./routes/games.js')(dbo, io));
  app.use('/api/scores', require('./routes/scores.js')(dbo));

  // Socket.io setup
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Start server
  server.listen(port, () => { console.log(`Server running on http://localhost:${port}`); });
});