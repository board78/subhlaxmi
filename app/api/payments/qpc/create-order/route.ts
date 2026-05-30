import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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

function qpcSign(merchantId: string, merchantOrderNo: string, amount: string, secretKey: string) {
  const raw = merchantId + merchantOrderNo + amount + secretKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

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

    const merchantId = process.env.QPC_MERCHANT_ID;
    const secretKey = process.env.QPC_SECRET_KEY;
    if (!merchantId || !secretKey) return jsonError("QPC payment is not configured on the server.", 500);

    const merchantOrderNo = `sl${Date.now()}${Math.random().toString(16).slice(2, 7)}`.slice(0, 48);
    const amountStr = orderAmount.toFixed(2);

    const origin = request.nextUrl.origin;
    const returnUrl = `${origin}/payment-status?orderId=${merchantOrderNo}`;
    const callbackUrl = `${origin}/api/payments/qpc/callback`;

    const signature = qpcSign(merchantId, merchantOrderNo, amountStr, secretKey);

    const totalTickets = cart.items.reduce((s, i) => s + i.ticketNumbers.length, 0);

    const res = await fetch("https://portalquickpaycash.com/api/payin/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        merchantOrderNo,
        amount: amountStr,
        currency: "INR",
        payerName: user.name ?? "",
        payerEmail: user.email ?? "",
        payerMobile: "9999999999",
        description: `${totalTickets} lottery ticket${totalTickets !== 1 ? "s" : ""}`,
        returnUrl,
        callbackUrl,
        signature,
      }),
    });

    const data = (await res.json()) as {
      status?: string;
      message?: string;
      data?: { paymentLink?: string; platOrderNo?: string };
    };

    if (data.status !== "200" || !data.data?.paymentLink) {
      return NextResponse.json(
        { error: data.message ?? "Unable to create QPC payment order." },
        { status: 502 },
      );
    }

    await upsertPendingPayment({
      provider: "qpc",
      orderId: merchantOrderNo,
      orderAmount,
      currency: "INR",
      cart,
      status: "created",
      userId: new ObjectId(user.id),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      paymentLink: data.data.paymentLink,
      merchantOrderNo,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create payment order.");
  }
}
