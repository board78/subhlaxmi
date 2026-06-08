import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
import { getPendingPayment, markPaymentProcessed } from "@/lib/payments";
import { confirmReservedTickets } from "@/lib/draws";
import { getDb } from "@/lib/mongodb";
import { callQpcPayinStatus } from "@/lib/qpc";
import { sendBookingConfirmationEmail } from "@/lib/emails";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retry a DB write up to `attempts` times with linear backoff.
 * Keeps the write off the critical path — a single transient error
 * won't cause the user to see "payment failed".
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 250,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastErr;
}

/**
 * Normalize QPC orderStatus to one of our internal labels.
 * CLEARED means funds have settled — treat same as SUCCESS.
 * EXPIRED means the order window passed — treat same as FAILED.
 */
function normalizeQpcStatus(
  raw: string,
): "SUCCESS" | "FAILED" | "PENDING" | "CREATED" {
  switch (raw.toUpperCase()) {
    case "SUCCESS":
    case "CLEARED":
      return "SUCCESS";
    case "FAILED":
    case "EXPIRED":
      return "FAILED";
    case "CREATED":
      return "CREATED";
    default:
      return "PENDING";
  }
}

/**
 * Confirm all reserved tickets (reserved → sold) and insert
 * user-visible ticket records.  Per-draw errors are caught and
 * logged so one bad draw doesn't block the rest of the cart.
 */
async function fulfillOrder(userId: string, cart: CartState): Promise<number> {
  const db = await getDb();
  const userObjectId = new ObjectId(userId);
  let totalBooked = 0;

  for (const item of cart.items) {
    if (!item.ticketNumbers.length) continue;

    try {
      const booking = await confirmReservedTickets(
        userId,
        item.drawId,
        item.ticketNumbers,
      );
      const bookedNumbers = booking.booked.map((t) => t.number);

      if (bookedNumbers.length) {
        const bookedAt = new Date();
        await db.collection("tickets").insertMany(
          bookedNumbers.map((ticketNumber) => ({
            userId: userObjectId,
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
          `[QPC status] Confirmed ${bookedNumbers.length} tickets for draw ${item.drawId}`,
        );
      }

      if (booking.failed.length) {
        console.warn(
          `[QPC status] ${booking.failed.length} tickets unavailable for draw ${item.drawId}:`,
          booking.failed,
        );
      }
    } catch (err) {
      console.error(
        `[QPC status] Error confirming tickets for draw ${item.drawId}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return totalBooked;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Sign in required.", 401);

    const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
    if (!orderId) return jsonError("orderId is required.");

    const pending = await getPendingPayment("qpc", orderId);
    if (!pending) return jsonError("Order not found.", 404);
    if (pending.userId.toString() !== user.id)
      return jsonError("Unauthorized.", 403);

    const cart = pending.cart as CartState;

    // ── Fast path: DB already has a terminal state ────────────────────────────
    // The callback sets this before we would ever poll QPC ourselves.
    if (pending.status === "processed") {
      return NextResponse.json({
        status: "SUCCESS",
        draws:
          cart?.items?.map((i) => ({
            name: i.drawName,
            tickets: i.ticketNumbers.length,
            numbers: i.ticketNumbers.slice(0, 6),
          })) ?? [],
        amount: pending.orderAmount,
      });
    }

    if (pending.status === "failed") {
      return NextResponse.json({ status: "FAILED" });
    }

    // ── Always poll QPC for live status ──────────────────────────────────────
    // This runs whenever DB is not yet in a terminal state ("created" / "paid").
    // QPC is the source of truth — we then sync our DB to match.
    const qpcResult = await callQpcPayinStatus(orderId);

    if (!qpcResult.ok) {
      // QPC unreachable — return current DB status so frontend keeps polling
      console.warn(`[QPC status] QPC API error for ${orderId}:`, qpcResult.error);
      return NextResponse.json({ status: "PENDING" });
    }

    const orderStatus = normalizeQpcStatus(qpcResult.data.orderStatus ?? "");

    // ── QPC says payment is done (SUCCESS or CLEARED) ─────────────────────────
    if (orderStatus === "SUCCESS") {
      // Re-read DB to guard against a concurrent callback that just finished
      const fresh = await getPendingPayment("qpc", orderId);
      if (fresh?.status === "processed") {
        return NextResponse.json({
          status: "SUCCESS",
          draws:
            cart?.items?.map((i) => ({
              name: i.drawName,
              tickets: i.ticketNumbers.length,
              numbers: i.ticketNumbers.slice(0, 6),
            })) ?? [],
          amount: pending.orderAmount,
        });
      }

      // Mark processed in DB — retry up to 3× so a transient Mongo hiccup
      // doesn't leave the user stuck on "confirming".
      try {
        await withRetry(() =>
          markPaymentProcessed("qpc", orderId, "processed"),
        );
        console.log(`[QPC status] Marked processed in DB: ${orderId}`);
      } catch (dbErr) {
        // Retries exhausted — log for ops but still proceed to return SUCCESS.
        // The QPC callback will arrive and fix the DB state asynchronously.
        console.error(
          `[QPC status] Failed to mark processed after retries for ${orderId}:`,
          dbErr,
        );
      }

      // Fulfill tickets — per-draw errors are handled inside fulfillOrder
      try {
        const booked = await fulfillOrder(user.id, cart);
        console.log(
          `[QPC status] ${booked} tickets confirmed for order ${orderId}`,
        );
      } catch (err) {
        console.error(`[QPC status] fulfillOrder error for ${orderId}:`, err);
      }

      // Get user details to send email
      try {
        const db = await getDb();
        const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
        if (userDoc?.email) {
          void sendBookingConfirmationEmail({
            email: userDoc.email,
            name: userDoc.name || "Customer",
            orderId: orderId,
            amount: pending.orderAmount,
            items: cart.items,
          }).catch((err) => console.error("[QPC status] Email error:", err));
        }
      } catch (emailErr) {
        console.error("[QPC status] User details / email send failed:", emailErr);
      }

      // Clear user's cart in DB upon successful booking
      try {
        const db = await getDb();
        await db.collection("carts").updateOne(
          { userId: new ObjectId(user.id) },
          { $set: { cart: { items: [], updatedAt: new Date().toISOString() }, updatedAt: new Date() } }
        );
      } catch (cartErr) {
        console.error("[QPC status] DB cart clear failed:", cartErr);
      }

      return NextResponse.json({
        status: "SUCCESS",
        draws:
          cart?.items?.map((i) => ({
            name: i.drawName,
            tickets: i.ticketNumbers.length,
            numbers: i.ticketNumbers.slice(0, 6),
          })) ?? [],
        amount: pending.orderAmount,
      });
    }

    // ── QPC says payment failed or expired ────────────────────────────────────
    if (orderStatus === "FAILED") {
      try {
        await withRetry(() => markPaymentProcessed("qpc", orderId, "failed"));
      } catch (dbErr) {
        console.error(
          `[QPC status] Failed to mark failed after retries for ${orderId}:`,
          dbErr,
        );
      }
      return NextResponse.json({ status: "FAILED" });
    }

    // ── Still pending / created — tell frontend to keep polling ───────────────
    return NextResponse.json({ status: orderStatus });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unable to check payment status.",
    );
  }
}
