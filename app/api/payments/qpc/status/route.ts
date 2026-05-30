import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Sign in required.", 401);

    const orderId = request.nextUrl.searchParams.get("orderId")?.trim();
    if (!orderId) return jsonError("orderId is required.");

    const pending = await getPendingPayment("qpc", orderId);
    if (!pending) return jsonError("Order not found.", 404);
    if (pending.userId.toString() !== user.id) return jsonError("Unauthorized.", 403);

    if (pending.status === "processed") {
      const cart = pending.cart as CartState;
      return NextResponse.json({
        status: "SUCCESS",
        draws: cart?.items?.map((i) => ({
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

    const res = await fetch("https://portalquickpaycash.com/api/payin/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantOrderNo: orderId }),
      cache: "no-store",
    });

    const data = (await res.json()) as {
      status?: string;
      message?: string;
      data?: { orderStatus?: string; amount?: number; utr?: string };
    };

    const orderStatus = data.data?.orderStatus ?? "PENDING";

    if (orderStatus === "SUCCESS" && pending.status !== "processed") {
      const cart = pending.cart as CartState;
      if (cart?.items?.length) {
        const db = await getDb();
        const userId = new ObjectId(pending.userId);

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
      }

      await markPaymentProcessed("qpc", orderId, "processed");

      const cart = pending.cart as CartState;
      return NextResponse.json({
        status: "SUCCESS",
        draws: cart?.items?.map((i) => ({
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
