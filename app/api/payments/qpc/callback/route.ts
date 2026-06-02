import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getPendingPayment, markPaymentProcessed } from "@/lib/payments";
import { bookTicketsByNumbers } from "@/lib/draws";
import { getDb } from "@/lib/mongodb";
import {
  getQpcMerchantId,
  getQpcMerchantKey,
  verifyPayinCallbackSign,
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
  platOrderNo?: string;
  orderStatus?: string;
  orderMessage?: string;
  amount?: number | string;
  merchantFee?: number;
  utr?: string;
  sign?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QpcCallbackBody;

    const merchantId = getQpcMerchantId();
    const merchantKey = getQpcMerchantKey();
    if (!merchantId || !merchantKey) {
      return new NextResponse("Not configured", { status: 500 });
    }

    const { merchantOrderNo, orderStatus, amount, sign } = body;
    const merchantNo = body.merchantNo?.trim();

    if (!merchantOrderNo || !sign) {
      return new NextResponse("Bad request", { status: 400 });
    }

    if (merchantNo && merchantNo !== merchantId) {
      console.error("[QPC callback] merchantNo mismatch:", merchantNo);
      return new NextResponse("Invalid merchant", { status: 400 });
    }

    if (!verifyPayinCallbackSign(merchantId, merchantOrderNo, amount, sign, merchantKey)) {
      console.error("[QPC callback] invalid signature for order", merchantOrderNo);
      return new NextResponse("Invalid signature", { status: 400 });
    }

    if (orderStatus === "FAILED") {
      await markPaymentProcessed("qpc", merchantOrderNo, "failed");
      return new NextResponse("OK", { status: 200 });
    }

    if (orderStatus !== "SUCCESS") {
      return new NextResponse("OK", { status: 200 });
    }

    const pending = await getPendingPayment("qpc", merchantOrderNo);
    if (!pending || pending.status === "processed") {
      return new NextResponse("OK", { status: 200 });
    }

    const cart = pending.cart as CartState;
    if (!cart?.items?.length) {
      await markPaymentProcessed("qpc", merchantOrderNo, "processed");
      return new NextResponse("OK", { status: 200 });
    }

    const db = await getDb();
    const userId = new ObjectId(pending.userId);

    for (const item of cart.items) {
      const booking = await bookTicketsByNumbers(
        pending.userId.toString(),
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

    await markPaymentProcessed("qpc", merchantOrderNo, "processed");
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[QPC callback] error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
