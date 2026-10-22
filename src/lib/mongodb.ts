import { Db, MongoClient } from "mongodb";
import dns from "node:dns";

// Fix for Node.js ESERVFAIL on Windows/certain ISPs when resolving MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore in restricted environments
}

let rawUri = process.env.MONGODB_URI || "";

// If URI is mongodb+srv for cluster0.6mdwxxm.mongodb.net, automatically rewrite to direct non-SRV replica-set string
// to completely prevent DNS SRV failures (ESERVFAIL) on Windows and Indian ISPs (Jio, Airtel, local broadband)
if (rawUri.startsWith("mongodb+srv://") && rawUri.includes("cluster0.6mdwxxm.mongodb.net")) {
  rawUri = "mongodb://boardoracle_db_user:Y2wA0vJCnAN3LZEb@ac-d2pmnm4-shard-00-00.6mdwxxm.mongodb.net:27017,ac-d2pmnm4-shard-00-01.6mdwxxm.mongodb.net:27017,ac-d2pmnm4-shard-00-02.6mdwxxm.mongodb.net:27017/subhlaxmi?ssl=true&authSource=admin&replicaSet=atlas-iy7d14-shard-0";
}

const uri = rawUri;
const dbName = process.env.MONGODB_DB ?? "subhlaxmi";

if (!uri) {
  throw new Error("Please define MONGODB_URI in your environment.");
}

declare global {
  var _subhlaxmiMongoClientPromise: Promise<MongoClient> | undefined;
  var _subhlaxmiCachedUri: string | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  // If URI changed or promise rejected/undefined, create fresh client
  if (!global._subhlaxmiMongoClientPromise || global._subhlaxmiCachedUri !== uri) {
    global._subhlaxmiCachedUri = uri;
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
    });
    global._subhlaxmiMongoClientPromise = client.connect().catch((err) => {
      // Clear cached promise on failure so subsequent requests can retry
      global._subhlaxmiMongoClientPromise = undefined;
      throw err;
    });
  }
  return global._subhlaxmiMongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const connectedClient = await getClientPromise();
  return connectedClient.db(dbName);
}
