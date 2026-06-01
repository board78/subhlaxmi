import { getDb } from "../lib/mongodb";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  try {
    console.log("Connecting using MONGODB_URI:", process.env.MONGODB_URI);
    const db = await getDb();
    console.log("Database connection successful!");
    
    // Test insert
    console.log("Testing insertOne...");
    const res = await db.collection("carousel_images").insertOne({
      url: "https://example.com/test-image.png",
      order: 99,
      createdAt: new Date(),
    });
    console.log("Insert successful! insertedId:", res.insertedId.toString());
    
    // Clean up
    console.log("Cleaning up inserted document...");
    const delRes = await db.collection("carousel_images").deleteOne({
      _id: res.insertedId
    });
    console.log("Cleanup successful! Deleted count:", delRes.deletedCount);
  } catch (err) {
    console.error("DB test failed:", err);
  }
}

run();
