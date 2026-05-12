import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
import { getPendingPayment, markPaymentProcessed } from "@/lib/payments";
import { bookTicketsByNumbers } from "@/lib/draws";
import { getDb } from "@/lib/mongodb";

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
    if (!user) return jsonError("Sign in to verify payment.", 401);

    const body = (await request.json()) as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return jsonError("Missing payment details.");
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return jsonError("Razorpay is not configured on the server.", 500);

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return jsonError("Payment signature verification failed.", 400);
    }

    // Fetch pending payment record
    const pending = await getPendingPayment("razorpay", razorpay_order_id);
    if (!pending) return jsonError("Order not found.", 404);
    if (pending.userId.toString() !== user.id) return jsonError("Unauthorized.", 403);
    if (pending.status === "processed") return NextResponse.json({ ok: true });

    const cart = pending.cart as CartState;
    if (!cart?.items?.length) return jsonError("Cart snapshot missing for this order.", 500);

    // Book tickets and write history records
    const db = await getDb();
    const userId = new ObjectId(user.id);

    for (const item of cart.items) {
      const booking = await bookTicketsByNumbers(user.id, item.drawId, item.ticketNumbers);
      const bookedNumbers = booking.booked.map((t) => t.number);

      if (bookedNumbers.length) {
        const bookedAt = new Date();
        await db.collection("tickets").insertMany(
          bookedNumbers.map((ticketNumber) => ({
            userId,
            drawName: item.drawName,
            prize: `₹${item.pricePerTicket} + GST`,
            drawTime: `${new Date(item.drawDate).toLocaleDateString("en-IN")} • ${item.drawTime}`,
            ticketNumber,
            status: "draw_pending",
            bookedAt,
          })),
        );
      }
    }

    await markPaymentProcessed("razorpay", razorpay_order_id, "processed");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Razorpay verify error:", error);
    return jsonError(error instanceof Error ? error.message : "Unable to verify payment.");
  }
}
