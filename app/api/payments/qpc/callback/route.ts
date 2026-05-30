import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { ObjectId } from "mongodb";
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

function qpcSign(merchantId: string, merchantOrderNo: string, amount: string, secretKey: string) {
  const raw = merchantId + merchantOrderNo + amount + secretKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      merchantNo?: string;
      merchantOrderNo?: string;
      platOrderNo?: string;
      orderStatus?: string;
      amount?: number | string;
      merchantFee?: number;
      utr?: string;
      sign?: string;
    };

    const merchantId = process.env.QPC_MERCHANT_ID;
    const secretKey = process.env.QPC_SECRET_KEY;
    if (!merchantId || !secretKey) return new NextResponse("Not configured", { status: 500 });

    const { merchantOrderNo, orderStatus, amount, sign } = body;
    if (!merchantOrderNo || !sign) return new NextResponse("Bad request", { status: 400 });

    const expectedSign = qpcSign(merchantId, merchantOrderNo, String(amount ?? ""), secretKey);
    if (expectedSign !== sign) {
      console.error("QPC callback: invalid signature for order", merchantOrderNo);
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
      const booking = await bookTicketsByNumbers(pending.userId.toString(), item.drawId, item.ticketNumbers);
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
    console.error("QPC callback error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
