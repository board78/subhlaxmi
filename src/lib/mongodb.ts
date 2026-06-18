import { Db, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "subhlaxmi";

if (!uri) {
  throw new Error("Please define MONGODB_URI in your environment.");
}

declare global {
  var _subhlaxmiMongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

// Cache the connection promise in the global object for BOTH dev and production.
// In dev: prevents multiple connections during hot-reload.
// In production (serverless): reuses the connection across invocations on the same instance.
if (!global._subhlaxmiMongoClientPromise) {
  global._subhlaxmiMongoClientPromise = client.connect();
}

const clientPromise = global._subhlaxmiMongoClientPromise;

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
