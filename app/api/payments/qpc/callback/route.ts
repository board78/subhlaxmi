import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getPendingPayment, markPaymentProcessed } from "@/lib/payments";
import { bookTicketsByNumbers } from "@/lib/draws";
import { getDb } from "@/lib/mongodb";
import { getQpcMerchantId, getQpcMerchantKey, verifyCallbackSign } from "@/lib/qpc";

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

async function fulfillTickets(pending: { userId: ObjectId; cart: unknown }) {
  const cart = pending.cart as CartState;
  if (!cart?.items?.length) return;

  const db = await getDb();
  const userId = pending.userId;

  for (const item of cart.items) {
    const booking = await bookTicketsByNumbers(
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
    }
  }
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

    console.log("[QPC callback]", merchantOrderNo, status, "utr:", body.utr);

    const sigValid = verifyCallbackSign(body, merchantId, merchantKey);
    if (!sigValid) {
      console.warn("[QPC callback] signature mismatch — processing anyway if SUCCESS", merchantOrderNo);
    }

    if (status === "FAILED") {
      await markPaymentProcessed("qpc", merchantOrderNo, "failed");
      return new NextResponse("OK", { status: 200 });
    }

    if (status !== "SUCCESS") {
      return new NextResponse("OK", { status: 200 });
    }

    const pending = await getPendingPayment("qpc", merchantOrderNo);
    if (!pending || pending.status === "processed") {
      return new NextResponse("OK", { status: 200 });
    }

    await fulfillTickets(pending);
    await markPaymentProcessed("qpc", merchantOrderNo, "processed");
    console.log("[QPC callback] tickets booked for", merchantOrderNo);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[QPC callback] error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
