const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.ATLAS_URI;

let _db;

// Connect to MongoDB
const connectToServer = (callback) => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
  // Establish the connection
  async function run() {
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      _db = client.db('banking');
      console.log('Connected to Banking Database');
      if (callback) callback();
    } catch (err) {
      console.error('Connection failed:', err);
      if (callback) callback(err);
    }
  }
  run();
};

// Get the database instance
const getDb = () => {
  if (!_db) throw new Error('Database not initialized');
  return _db;
};

module.exports = { connectToServer, getDb };