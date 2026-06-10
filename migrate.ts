import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function migrate() {
  const client = new MongoClient(process.env.MONGODB_URI as string);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "subhlaxmi");

  const draws = await db.collection("draws").find({ drawNumber: { $lt: 100 } }).toArray();
  for (const draw of draws) {
    const newDrawNumber = draw.drawNumber + 100;
    const newName = draw.name.replace(/#\d+/, `#${newDrawNumber}`);
    await db.collection("draws").updateOne(
      { _id: draw._id },
      { $set: { drawNumber: newDrawNumber, name: newName } }
    );
    console.log(`Updated ${draw.name} to ${newName}`);
  }
  await client.close();
  console.log("Migration done");
}

migrate().catch(console.error);
