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
const clientPromise = global._subhlaxmiMongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  global._subhlaxmiMongoClientPromise = clientPromise;
}

export async function getDb(): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
