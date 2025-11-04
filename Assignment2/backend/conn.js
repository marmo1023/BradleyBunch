import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = process.env.ATLAS_URI;

let _db;

export const connectToServer = (callback) => {
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
      await client.db("admin").command({ ping: 1 });
      console.log("Connected to MongoDB!");
      _db = client.db("users");
    } catch (err) {
      console.error(err);
    }
  }

  run().then(() => callback()).catch(callback);
};

export const getDb = () => {
  if (!_db) throw new Error("DB not initialized");
  return _db;
};
