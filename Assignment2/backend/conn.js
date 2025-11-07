const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.ATLAS_URI;

let _db;

const connectToServer = (callback) => {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  async function run() {
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      console.log('Connected to MongoDB');
      _db = client.db('banking');
      if (callback) callback();
    } catch (err) {
      console.error('Connection failed:', err);
      if (callback) callback(err);
    }
  }

  run();
};

const getDb = () => {
  if (!_db) {
    throw new Error('Database not initialized');
  }
  return _db;
};

module.exports = { connectToServer, getDb };