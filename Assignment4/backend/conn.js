const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.ATLAS_URI;
let _db;

const connectToServer = async (callback) => {
  const client = new MongoClient(uri, {
    serverApi: { 
      version: ServerApiVersion.v1, 
      strict: true, 
      deprecationErrors: true },
  });
  
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    _db = client.db('cardGame');
    console.log('Connected to cardGame Database');
    if (callback) callback();
  } catch (err) {
    console.error('Connection failed:', err);
    if (callback) callback(err);
  }
};

const getDb = () => {
  if (!_db) throw new Error('Database not initialized');
  return _db;
};

module.exports = { connectToServer, getDb };