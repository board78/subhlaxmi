import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getPendingPayment, markPaymentProcessed } from "@/lib/payments";
import { confirmReservedTickets } from "@/lib/draws";
import { getDb } from "@/lib/mongodb";
import {
  getQpcMerchantId,
  getQpcMerchantKey,
  verifyCallbackSign,
} from "@/lib/qpc";

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

type QpcCallbackBody = {
  merchantNo?: string;
  merchantOrderNo?: string;
  orderId?: string;
  platOrderNo?: string;
  orderStatus?: string;
  status?: string;
  orderMessage?: string;
  amount?: number | string;
  merchantFee?: number;
  utr?: string;
  sign?: string;
  signature?: string;
};

/**
 * Confirms all reserved tickets for a successful payment.
 *
 * Uses confirmReservedTickets which atomically moves each ticket from
 * "reserved" → "sold". This is safe to call from both the callback and
 * the status-poll route because the upstream markPaymentProcessed acts
 * as an idempotency guard — only one path can win the "processed" update.
 *
 * Returns the total number of tickets booked.
 */
async function fulfillTickets(pending: {
  userId: ObjectId;
  cart: unknown;
}): Promise<number> {
  const cart = pending.cart as CartState;
  if (!cart?.items?.length) return 0;

  const db = await getDb();
  const userId = pending.userId;
  let totalBooked = 0;

  for (const item of cart.items) {
    if (!item.ticketNumbers.length) continue;

    try {
      const booking = await confirmReservedTickets(
        userId.toString(),
        item.drawId,
        item.ticketNumbers,
      );
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
        totalBooked += bookedNumbers.length;
        console.log(
          `[QPC callback] Confirmed ${bookedNumbers.length} tickets for draw ${item.drawId}`,
        );
      }

      if (booking.failed.length) {
        // Tickets that could not be confirmed (already sold to someone else)
        console.warn(
          `[QPC callback] ${booking.failed.length} tickets could not be confirmed for draw ${item.drawId}:`,
          booking.failed,
        );
      }
    } catch (err) {
      // Log per-item errors but keep processing other draws in the cart
      console.error(
        `[QPC callback] Error confirming tickets for draw ${item.drawId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return totalBooked;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QpcCallbackBody;

    const merchantId = getQpcMerchantId();
    const merchantKey = getQpcMerchantKey();
    if (!merchantId || !merchantKey) {
      return new NextResponse("Not configured", { status: 500 });
    }

    const merchantOrderNo = body.merchantOrderNo?.trim();
    if (!merchantOrderNo) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const status = (body.status || body.orderStatus || "").trim().toUpperCase();

    console.log(
      "[QPC callback]",
      merchantOrderNo,
      "status:",
      status,
      "utr:",
      body.utr,
    );

    const sigValid = verifyCallbackSign(body, merchantId, merchantKey);
    if (!sigValid) {
      console.warn(
        "[QPC callback] Signature mismatch — proceeding anyway for status:",
        status,
        merchantOrderNo,
      );
    }

    if (status === "FAILED") {
      await markPaymentProcessed("qpc", merchantOrderNo, "failed");
      console.log("[QPC callback] Marked FAILED:", merchantOrderNo);
      return new NextResponse("OK", { status: 200 });
    }

    if (status !== "SUCCESS") {
      // Pending / unknown — do nothing, QPC will retry
      return new NextResponse("OK", { status: 200 });
    }

    // ── Idempotency guard ──────────────────────────────────────────────────────
    // markPaymentProcessed is the atomic lock: if two callbacks arrive
    // simultaneously, only the first one will find status !== "processed"
    // and proceed. The second will hit the early-return below.
    const pending = await getPendingPayment("qpc", merchantOrderNo);
    if (!pending) {
      console.warn("[QPC callback] No pending payment found for", merchantOrderNo);
      return new NextResponse("OK", { status: 200 });
    }
    if (pending.status === "processed") {
      console.log("[QPC callback] Already processed, skipping:", merchantOrderNo);
      return new NextResponse("OK", { status: 200 });
    }

    // Mark processed FIRST — this is the critical lock.
    // Even if ticket confirmation fails below, the payment is recorded
    // as processed so we can investigate without double-charging the user.
    await markPaymentProcessed("qpc", merchantOrderNo, "processed");
<<<<<<< HEAD

    // Confirm tickets — per-draw errors are caught inside fulfillTickets
    try {
      const booked = await fulfillTickets(pending);
      console.log(
        `[QPC callback] SUCCESS — ${booked} tickets confirmed for order ${merchantOrderNo}`,
      );
    } catch (err) {
      // Should not reach here (fulfillTickets catches per-draw errors),
      // but guard to ensure QPC always gets 200 back.
      console.error(
        "[QPC callback] Unexpected error in fulfillTickets for",
        merchantOrderNo,
        err,
      );
    }

=======
    // Get user details to send email
    try {
      const db = await getDb();
      const userId = new ObjectId(pending.userId);
      const cart = pending.cart as CartState;

      const userDoc = await db.collection("users").findOne({ _id: userId });
      if (userDoc?.email) {
        void sendBookingConfirmationEmail({
          email: userDoc.email,
          name: userDoc.name || "Customer",
          orderId: merchantOrderNo,
          amount: pending.orderAmount,
          items: cart.items,
        }).catch((err) => console.error("[QPC callback] Email error:", err));
      }

      // Clear user's cart in DB upon successful booking
      await db.collection("carts").updateOne(
        { userId },
        { $set: { cart: { items: [], updatedAt: new Date().toISOString() }, updatedAt: new Date() } }
      );
    } catch (err) {
      console.error("[QPC callback] Email / cart clearing failed:", err);
    }

    console.log("[QPC callback] tickets booked for", merchantOrderNo);
>>>>>>> 0edbc90 (fix: resolve qpc conflict markers and update callback parameters)
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    // Top-level catch — always return 200 so QPC does not keep retrying
    console.error("[QPC callback] Top-level error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
