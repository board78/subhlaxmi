import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "subhlaxmi";
  if (!uri) {
    console.error("MONGODB_URI is not defined");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  const userId = new ObjectId("6a0172cb5b05619aba00367f"); // Bhaviraj user ID

  console.log("--- Bhaviraj's Cart ---");
  const cart = await db.collection("carts").findOne({ userId });
  console.log(JSON.stringify(cart, null, 2));

  console.log("--- Bhaviraj's Payments ---");
  const payments = await db.collection("payments").find({ userId }).toArray();
  console.log(payments);

  console.log("--- Bhaviraj's Tickets ---");
  const tickets = await db.collection("tickets").find({ userId }).toArray();
  console.log(tickets);

  await client.close();
}

main().catch(console.error);
