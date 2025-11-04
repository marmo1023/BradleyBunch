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
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Connected to MongoDB!');
    _db = client.db('users');
  }

  run()
    .then(() => { if (callback) callback(); })
    .catch((err) => { console.error(err); if (callback) callback(err); });
};

const getDb = () => {
  if (!_db) throw new Error('DB not initialized');
  return _db;
};

module.exports = { connectToServer, getDb };