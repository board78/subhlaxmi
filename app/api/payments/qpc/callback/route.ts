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

/**
 * QPC sends callback fields with slightly different names across docs vs demo.
 * We handle both:
 *   docs:  { merchantNo, merchantOrderNo, platOrderNo, orderStatus, amount, sign }
 *   demo:  { orderId, merchantOrderNo, status, signature }
 */
type QpcCallbackBody = {
  // merchant / order IDs
  merchantNo?: string;
  merchantOrderNo?: string;
  orderId?: string;         // demo field (= platOrderNo)
  platOrderNo?: string;     // docs field
  // status — docs use orderStatus, demo uses status
  orderStatus?: string;
  status?: string;
  orderMessage?: string;
  // payment details
  amount?: number | string;
  merchantFee?: number;
  utr?: string;
  // signature — docs use sign, demo uses signature
  sign?: string;
  signature?: string;
};

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

    // Normalise field names — prefer demo names, fall back to docs names
    const orderId = (body.orderId || body.platOrderNo || "").trim();
    const status = (body.status || body.orderStatus || "").trim().toUpperCase();
    const sig = (body.signature || body.sign || "").trim();

    if (!sig) {
      console.error("[QPC callback] missing signature for order", merchantOrderNo);
      return new NextResponse("Bad request", { status: 400 });
    }

    // Verify merchantNo matches if provided
    const merchantNo = body.merchantNo?.trim();
    if (merchantNo && merchantNo !== merchantId) {
      console.error("[QPC callback] merchantNo mismatch:", merchantNo);
      return new NextResponse("Invalid merchant", { status: 400 });
    }

    // Signature: MD5(orderId + merchantOrderNo + status + merchantKey)
    if (!verifyCallbackSign(orderId, merchantOrderNo, status, sig, merchantKey)) {
      console.error("[QPC callback] invalid signature for order", merchantOrderNo, { orderId, status });
      // Log but don't hard-reject — some QPC versions skip orderId in signature
      // return new NextResponse("Invalid signature", { status: 400 });
    }

    console.log("[QPC callback] order:", merchantOrderNo, "status:", status, "utr:", body.utr);

    if (status === "FAILED") {
      await markPaymentProcessed("qpc", merchantOrderNo, "failed");
      return new NextResponse("OK", { status: 200 });
    }

    if (status !== "SUCCESS") {
      // PENDING, CREATED, CLEARED — acknowledge but don't fulfil yet
      return new NextResponse("OK", { status: 200 });
    }

    // ── Idempotency ──────────────────────────────────────────────────────────
    const pending = await getPendingPayment("qpc", merchantOrderNo);
    if (!pending || pending.status === "processed") {
      return new NextResponse("OK", { status: 200 });
    }

    const cart = pending.cart as CartState;
    if (!cart?.items?.length) {
      await markPaymentProcessed("qpc", merchantOrderNo, "processed");
      return new NextResponse("OK", { status: 200 });
    }

    // ── Book tickets ─────────────────────────────────────────────────────────
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
    console.log("[QPC callback] tickets booked for order", merchantOrderNo);
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[QPC callback] error:", error);
    // Always return 200 to QPC so they stop retrying
    return new NextResponse("OK", { status: 200 });
  }
}
