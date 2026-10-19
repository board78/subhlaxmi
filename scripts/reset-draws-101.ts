import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "subhlaxmi";

if (!uri) {
  console.error("MONGODB_URI is not defined");
  process.exit(1);
}

// 7-day duration in milliseconds
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function generateTicketsForDrawDoc(db: any, draw: any) {
  const { _id: drawId, series, ticketPrefix, ticketRangeStart, ticketRangeEnd } = draw;
  const now = new Date();

  const totalTickets = ticketRangeEnd - ticketRangeStart + 1;
  const numSeries = series.length;
  const basePerSeries = Math.floor(totalTickets / numSeries);
  let remainder = totalTickets % numSeries;

  let currentStart = ticketRangeStart;
  const ticketsToInsert: any[] = [];

  for (let i = 0; i < series.length; i++) {
    const s = series[i];
    let seriesCount = basePerSeries + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;

    if (seriesCount <= 0) continue;

    const seriesEnd = currentStart + seriesCount - 1;

    for (let num = currentStart; num <= seriesEnd; num++) {
      const paddedNum = String(num).padStart(5, "0");
      const fullNumber = `${ticketPrefix}-${s}-${paddedNum}`;

      ticketsToInsert.push({
        drawId,
        number: fullNumber,
        numericPart: num,
        series: s,
        status: "available",
        category: "general",
        createdAt: now,
        updatedAt: now,
      });
    }

    currentStart = seriesEnd + 1;
  }

  // Insert in batches of 1000
  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < ticketsToInsert.length; i += BATCH) {
    const chunk = ticketsToInsert.slice(i, i + BATCH);
    try {
      const res = await db.collection("tickets").insertMany(chunk, { ordered: false });
      inserted += res.insertedCount;
    } catch (err: any) {
      if (err.insertedCount) inserted += err.insertedCount;
    }
  }

  return inserted;
}

async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(dbName);
  console.log("Connected successfully to database:", dbName);

  const now = new Date();

  // We set IST dates for current 7-day cycle:
  // Starts today at 16:00 IST (10:30 UTC), expires 7 days later at 16:00 IST (10:30 UTC)
  // Or relative to now:
  const activatesAt = new Date(now);
  const expiresAt = new Date(activatesAt.getTime() + SEVEN_DAYS_MS);
  const drawTime = "4:00 PM";

  console.log(`\nSetting up active 7-day cycle:`);
  console.log(`Activates at : ${activatesAt.toISOString()} (${activatesAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST)`);
  console.log(`Expires at   : ${expiresAt.toISOString()} (${expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST)`);
  console.log(`Draw time    : ${drawTime}\n`);

  // 1. Remove duplicate/test Shri Samridhi Classic draws (#102 to #109) and their tickets
  const samridhiDups = await db.collection("draws").find({
    drawSeriesName: "Shri Samridhi Classic",
    drawNumber: { $gt: 101 },
  }).toArray();

  if (samridhiDups.length > 0) {
    console.log(`Found ${samridhiDups.length} duplicate/old Shri Samridhi Classic draws (#102-#109). Cleaning up...`);
    const dupIds = samridhiDups.map((d) => d._id);
    const delTickets = await db.collection("tickets").deleteMany({ drawId: { $in: dupIds } });
    const delDraws = await db.collection("draws").deleteMany({ _id: { $in: dupIds } });
    console.log(`Cleaned up ${delDraws.deletedCount} old draws and ${delTickets.deletedCount} unbooked tickets.`);
  }

  // 2. Define the desired standard 7 series
  const seriesConfigs = [
    {
      drawSeriesName: "Subhlaxmi55",
      prizeAmount: "2500000",
      pricePerTicket: 115,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 11000,
    },
    {
      drawSeriesName: "Subhlaxmi25",
      prizeAmount: "500000",
      pricePerTicket: 107,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 6000,
    },
    {
      drawSeriesName: "Subhlaxmi15",
      prizeAmount: "25000",
      pricePerTicket: 125,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 1300,
    },
    {
      drawSeriesName: "Subhlaxmi12",
      prizeAmount: "15000",
      pricePerTicket: 112,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 1200,
    },
    {
      drawSeriesName: "Subhlaxmi5",
      prizeAmount: "7000",
      pricePerTicket: 101,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 1100,
    },
    {
      drawSeriesName: "Dhan Laxmi Bumper",
      prizeAmount: "1000000",
      pricePerTicket: 105,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 11000,
    },
    {
      drawSeriesName: "Shri Samridhi Classic",
      prizeAmount: "5000000",
      pricePerTicket: 151,
      series: ["A", "B", "C"],
      ticketPrefix: "SL",
      ticketRangeStart: 1000,
      ticketRangeEnd: 41000,
    },
  ];

  for (const config of seriesConfigs) {
    const existing = await db.collection("draws").findOne({ drawSeriesName: config.drawSeriesName });

    let drawId: ObjectId;

    if (existing) {
      drawId = existing._id;
      await db.collection("draws").updateOne(
        { _id: drawId },
        {
          $set: {
            name: `${config.drawSeriesName} #101`,
            drawSeriesName: config.drawSeriesName,
            drawNumber: 101,
            activatesAt,
            expiresAt,
            drawDate: expiresAt,
            drawTime,
            prizeAmount: config.prizeAmount,
            pricePerTicket: config.pricePerTicket,
            series: config.series,
            ticketPrefix: config.ticketPrefix,
            ticketRangeStart: config.ticketRangeStart,
            ticketRangeEnd: config.ticketRangeEnd,
            status: "active",
            updatedAt: now,
          },
          $unset: { statusOverride: "" },
        }
      );
      console.log(`Updated [${config.drawSeriesName} #101]`);
    } else {
      const newDoc = {
        name: `${config.drawSeriesName} #101`,
        drawSeriesName: config.drawSeriesName,
        drawNumber: 101,
        activatesAt,
        expiresAt,
        drawDate: expiresAt,
        drawTime,
        prizeAmount: config.prizeAmount,
        pricePerTicket: config.pricePerTicket,
        series: config.series,
        ticketPrefix: config.ticketPrefix,
        ticketRangeStart: config.ticketRangeStart,
        ticketRangeEnd: config.ticketRangeEnd,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      const res = await db.collection("draws").insertOne(newDoc);
      drawId = res.insertedId;
      console.log(`Created [${config.drawSeriesName} #101]`);
    }

    // Check ticket count
    const ticketCount = await db.collection("tickets").countDocuments({ drawId });
    if (ticketCount === 0) {
      console.log(`Generating tickets for [${config.drawSeriesName} #101]...`);
      const updatedDraw = await db.collection("draws").findOne({ _id: drawId });
      const inserted = await generateTicketsForDrawDoc(db, updatedDraw);
      console.log(`  -> Inserted ${inserted} tickets.`);
    } else {
      console.log(`  -> Already has ${ticketCount} tickets.`);
    }
  }

  console.log("\n================ CURRENT DRAWS IN DATABASE ================");
  const allDraws = await db.collection("draws").find({ status: "active" }).sort({ activatesAt: 1 }).toArray();
  for (const d of allDraws) {
    const tCount = await db.collection("tickets").countDocuments({ drawId: d._id });
    const sCount = await db.collection("tickets").countDocuments({ drawId: d._id, status: "sold" });
    console.log(`- ${d.name} (Draw #${d.drawNumber}) | Status: ${d.status} | Expires: ${new Date(d.expiresAt).toLocaleDateString("en-IN")} | Tickets: ${tCount} (Sold: ${sCount})`);
  }
  console.log("===========================================================\n");

  await client.close();
  console.log("Database connection closed. Reset complete!");
}

main().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});
