import { MongoClient } from "mongodb";
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

  console.log("--- Recent Payments ---");
  const payments = await db.collection("payments").find().sort({ createdAt: -1 }).limit(10).toArray();
  console.log(payments.map(p => ({
    id: p._id.toString(),
    userId: p.userId?.toString(),
    orderId: p.orderId,
    status: p.status,
    amount: p.orderAmount,
    createdAt: p.createdAt
  })));

  console.log("--- Recent Booked Tickets (summary records) ---");
  const tickets = await db.collection("tickets").find({ userId: { $exists: true } }).sort({ bookedAt: -1 }).limit(15).toArray();
  console.log(tickets.map(t => ({
    id: t._id.toString(),
    userId: t.userId?.toString(),
    drawName: t.drawName,
    ticketNumber: t.ticketNumber,
    status: t.status,
    bookedAt: t.bookedAt
  })));

  console.log("--- Recent Sold Tickets (individual draw tickets) ---");
  const soldTickets = await db.collection("tickets").find({ status: "sold" }).sort({ bookedAt: -1 }).limit(15).toArray();
  console.log(soldTickets.map(t => ({
    id: t._id.toString(),
    drawId: t.drawId?.toString(),
    number: t.number,
    status: t.status,
    bookedBy: t.bookedBy?.toString(),
    bookedAt: t.bookedAt
  })));

  await client.close();
}

main().catch(console.error);
