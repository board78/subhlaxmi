import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  
  const payments = await db.collection("payments").find().toArray();
  console.log("=== PAYMENTS ===");
  for (const p of payments) {
    console.log(p._id, p.status, p.orderId, "user:", p.userId);
  }

  const tickets = await db.collection("tickets").find().toArray();
  console.log("=== TICKETS ===");
  for (const t of tickets) {
    console.log(t._id, "user:", t.userId, "ticket:", t.ticketNumber, "draw:", t.drawName);
  }

  await client.close();
}

run().catch(console.error);
