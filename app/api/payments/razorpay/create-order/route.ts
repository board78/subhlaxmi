import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getSessionUser, jsonError } from "@/lib/auth";
import { upsertPendingPayment } from "@/lib/payments";
import { ObjectId } from "mongodb";

type CartTicketItem = {
  drawId: string;
  drawName: string;
  drawDate: string;
  drawTime: string;
  pricePerTicket: number;
  ticketNumbers: string[];
};

type CartState = {
  items: CartTicketItem[];
  updatedAt: string;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Sign in to checkout.", 401);

    const body = (await request.json()) as { cart?: CartState };
    const cart = body.cart;
    if (!cart?.items?.length) return jsonError("Cart is empty.");

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.ticketNumbers.length * item.pricePerTicket,
      0,
    );
    const gst = Math.round(subtotal * 0.18 * 100) / 100;
    const orderAmount = Math.round((subtotal + gst) * 100) / 100;
    if (orderAmount <= 0) return jsonError("Invalid cart total.");

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret)
      return jsonError("Razorpay is not configured on the server.", 500);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    // Razorpay amount is in paise (multiply by 100)
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(orderAmount * 100),
      currency: "INR",
      receipt: `sl_${Date.now()}`.slice(0, 40),
      notes: {
        userId: user.id,
        userEmail: user.email ?? "",
      },
    });

    await upsertPendingPayment({
      provider: "razorpay",
      orderId: razorpayOrder.id,
      orderAmount,
      currency: "INR",
      cart,
      status: "created",
      userId: new ObjectId(user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,        // in paise
      currency: razorpayOrder.currency,
      key_id: keyId,
      user: {
        name: user.name ?? "",
        email: user.email ?? "",
      },
    });
  } catch (error) {
    console.error("Razorpay create-order error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Unable to create payment order.",
    );
  }
}
