import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, jsonError } from "@/lib/auth";
import { upsertPendingPayment } from "@/lib/payments";
import {
  buildPayinPayerFields,
  callQpcPayinCreate,
  getQpcMerchantId,
  getQpcMerchantKey,
  normalizeDeepLink,
  qpcPayinSign,
  resolveCheckoutUrl,
} from "@/lib/qpc";
import { getPublicAppOrigin } from "@/lib/utils";
import { ObjectId } from "mongodb";
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

    const merchantId = getQpcMerchantId();
    const merchantKey = getQpcMerchantKey();
    if (!merchantId || !merchantKey) {
      return jsonError("QPC payment is not configured on the server.", 500);
    }

    const db = await getDb();
    const userDoc = await db.collection("users").findOne({ _id: new ObjectId(user.id) });
    if (!userDoc) return jsonError("User profile not found.", 404);

    const payerFields = buildPayinPayerFields({
      name: userDoc.name,
      email: userDoc.email,
      phone: userDoc.phone,
    });

    if (!payerFields.payerMobile) {
      return jsonError(
        "Add your 10-digit mobile number in Profile before checkout.",
        400,
      );
    }

    const merchantOrderNo = `ORD${Date.now()}${Math.random().toString(16).slice(2, 6)}`.slice(0, 50);
    const amountStr = orderAmount.toFixed(2);

    const origin = getPublicAppOrigin(request);
    const returnUrl = `${origin}/payment-status?orderId=${merchantOrderNo}`;
    const callbackUrl = `${origin}/api/payments/qpc/callback`;

    const signature = qpcPayinSign(merchantId, merchantOrderNo, amountStr, merchantKey);
    const totalTickets = cart.items.reduce((s, i) => s + i.ticketNumbers.length, 0);

    const qpcResult = await callQpcPayinCreate({
      merchantId,
      merchantOrderNo,
      amount: amountStr,
      currency: "INR",
      signature,
      returnUrl,
      callbackUrl,
      description: `${totalTickets} lottery ticket${totalTickets !== 1 ? "s" : ""}`,
      payer: {
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone,
      },
    });

    if (!qpcResult.ok) {
      console.error("[QPC create-order]", qpcResult.error);
      return NextResponse.json({ error: qpcResult.error }, { status: 502 });
    }

    const checkoutUrl = resolveCheckoutUrl(qpcResult.data);
    const deepLink = normalizeDeepLink(qpcResult.data.deepLink);

    if (!checkoutUrl && !deepLink?.upi_intent) {
      return NextResponse.json(
        { error: "QPC did not return a payment page or UPI deep link. Contact QPC support." },
        { status: 502 },
      );
    }

    try {
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
    } catch (dbErr) {
      console.error("[QPC create-order] MongoDB save failed:", dbErr);
    }

    return NextResponse.json({
      paymentLink: checkoutUrl,
      paymentPageUrl: qpcResult.data.paymentPageUrl ?? null,
      upiId: qpcResult.data.paymentLink?.includes("@") ? qpcResult.data.paymentLink : null,
      deepLink,
      merchantOrderNo,
      platOrderNo: qpcResult.data.platOrderNo ?? null,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unable to create payment order.";
    console.error("[QPC create-order] exception:", msg);
    return jsonError(msg);
  }
}
