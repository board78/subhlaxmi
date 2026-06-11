import { ObjectId } from "mongodb";

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
