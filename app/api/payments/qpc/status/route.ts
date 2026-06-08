import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
import { getPendingPayment, markPaymentProcessed } from "@/lib/payments";
import { bookTicketsByNumbers } from "@/lib/draws";
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

async function fulfillOrder(userId: string, cart: CartState) {
  const db = await getDb();
  const userObjectId = new ObjectId(userId);

  for (const item of cart.items) {
    const booking = await bookTicketsByNumbers(userId, item.drawId, item.ticketNumbers);
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
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Sign in required.", 401);

    const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
    if (!orderId) return jsonError("orderId is required.");

    const pending = await getPendingPayment("qpc", orderId);
    if (!pending) return jsonError("Order not found.", 404);
    if (pending.userId.toString() !== user.id) return jsonError("Unauthorized.", 403);

    const cart = pending.cart as CartState;

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

    const qpcStatus = await callQpcPayinStatus(orderId);
    const orderStatus = qpcStatus.ok
      ? (qpcStatus.data.orderStatus ?? "PENDING")
      : "PENDING";

    if (orderStatus === "SUCCESS") {
      if (cart?.items?.length) {
        await fulfillOrder(user.id, cart);
      }
      await markPaymentProcessed("qpc", orderId, "processed");

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

    if (orderStatus === "FAILED") {
      await markPaymentProcessed("qpc", orderId, "failed");
      return NextResponse.json({ status: "FAILED" });
    }

    return NextResponse.json({ status: orderStatus });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to check payment status.");
  }
}
