import { ObjectId } from "mongodb";
import { getDb } from "./mongodb";

export type PendingPaymentDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  provider: "cashfree" | "razorpay" | "qpc";
  orderId: string;
  orderAmount: number;
  currency: "INR";
  cart: unknown;
  status: "created" | "paid" | "failed" | "processed";
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
};

export async function upsertPendingPayment(input: Omit<PendingPaymentDoc, "_id"> & { platOrderNo?: string }) {
  const db = await getDb();
  await db.collection<PendingPaymentDoc>("payments").updateOne(
    { provider: input.provider, orderId: input.orderId },
    {
      $set: { ...input, updatedAt: new Date() },
      $setOnInsert: { createdAt: input.createdAt },
    },
    { upsert: true },
  );
}

export async function getPendingPayment(
  provider: "cashfree" | "razorpay" | "qpc",
  orderId: string,
) {
  const db = await getDb();
  return db.collection<PendingPaymentDoc>("payments").findOne({ provider, orderId });
}

export async function markPaymentProcessed(
  provider: "cashfree" | "razorpay" | "qpc",
  orderId: string,
  status: PendingPaymentDoc["status"],
) {
  const db = await getDb();
  await db
    .collection<PendingPaymentDoc>("payments")
    .updateOne(
      { provider, orderId },
      { $set: { status, processedAt: new Date(), updatedAt: new Date() } },
    );
}
