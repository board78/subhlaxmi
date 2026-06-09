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
  appliedReferralCode?: string;
  usedDiscount?: boolean;
};

export async function upsertPendingPayment(
  input: Omit<PendingPaymentDoc, "_id"> & { platOrderNo?: string },
) {
  const db = await getDb();

  // Destructure createdAt out so it never lands in $set —
  // it must only appear in $setOnInsert to avoid the MongoDB
  // "conflict at createdAt" error on upsert.
  const { createdAt, ...rest } = input;

  await db.collection<PendingPaymentDoc>("payments").updateOne(
    { provider: input.provider, orderId: input.orderId },
    {
      $set: { ...rest, updatedAt: new Date() },
      $setOnInsert: { createdAt },
    },
    { upsert: true },
  );
}

export async function getPendingPayment(
  provider: "cashfree" | "razorpay" | "qpc",
  orderId: string,
) {
  const db = await getDb();
  return db
    .collection<PendingPaymentDoc>("payments")
    .findOne({ provider, orderId });
}

export async function markPaymentProcessed(
  provider: "cashfree" | "razorpay" | "qpc",
  orderId: string,
  status: PendingPaymentDoc["status"],
) {
  const db = await getDb();
  
  // Update status atomically. If it's already the target status, it returns null.
  const result = await db.collection<PendingPaymentDoc>("payments").findOneAndUpdate(
    { provider, orderId, status: { $ne: status } },
    { $set: { status, processedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" }
  );

  // If it was already processed, result is null.
  const payment = result;

  // If successfully processed to "processed" (paid) status, handle referral rewards
  if (payment && status === "processed") {
    if (payment.usedDiscount) {
      await db.collection("users").updateOne(
        { _id: payment.userId },
        { $inc: { availableDiscounts: -1 } }
      );
    }
    if (payment.appliedReferralCode) {
      await db.collection("users").updateOne(
        { referralCode: payment.appliedReferralCode },
        { $inc: { availableDiscounts: 1 } }
      );
    }
  }
}
