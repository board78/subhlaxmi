import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, jsonError } from "@/lib/auth";
import { upsertPendingPayment } from "@/lib/payments";
import {
  callQpcPayinCreate,
  generateMerchantOrderNo,
  getQpcMerchantId,
  getQpcMerchantKey,
  normalizeDeepLink,
  qpcPayinSign,
  resolveCheckoutUrl,
} from "@/lib/qpc";
import { reserveTickets, releaseReservations } from "@/lib/draws";
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
  const reservedItems: { drawId: string; tickets: string[] }[] = [];

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

    if (orderAmount < 100) {
      return jsonError(
        `Minimum order amount is ₹100. Your cart total is ₹${orderAmount.toFixed(2)}. Please add more tickets.`,
        400,
      );
    }

    const merchantId = getQpcMerchantId();
    const merchantKey = getQpcMerchantKey();
    if (!merchantId || !merchantKey) {
      return jsonError("Payment is not configured on the server.", 500);
    }

    // ── Step 1: Reserve every ticket in the cart atomically ──────────────────
    // This prevents two users from paying for the same ticket simultaneously.
    for (const item of cart.items) {
      if (!item.ticketNumbers.length) continue;

      const result = await reserveTickets(
        user.id,
        item.drawId,
        item.ticketNumbers,
      );

      // Track what we reserved so we can release on failure
      if (result.reserved.length) {
        reservedItems.push({ drawId: item.drawId, tickets: result.reserved });
      }

      if (result.failed.length > 0) {
        // Some tickets were taken by another user — release what we reserved
        // and return an error so the user can pick different tickets
        await releaseAll(user.id, reservedItems);
        return NextResponse.json(
          {
            error: `${result.failed.length} ticket(s) are no longer available (${result.failed.slice(0, 3).join(", ")}${result.failed.length > 3 ? "…" : ""}). Please go back and select different tickets.`,
          },
          { status: 409 },
        );
      }
    }

    // ── Step 2: Load payer info ───────────────────────────────────────────────
    const db = await getDb();
    const userDoc = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.id) });
    const payer = {
      name: (userDoc?.name as string | null) ?? user.name,
      email: (userDoc?.email as string | null) ?? user.email,
      phone: (userDoc?.phone as string | null) ?? null,
    };

    const merchantOrderNo = generateMerchantOrderNo();
    const amountStr = orderAmount.toFixed(2);

    const origin = getPublicAppOrigin(request);
    const redirectUrl = `${origin}/payment-status?orderId=${merchantOrderNo}`;
    const notifyUrl = `${origin}/api/payments/qpc/callback`;

    const signature = qpcPayinSign(
      merchantId,
      merchantOrderNo,
      amountStr,
      merchantKey,
    );
    const totalTickets = cart.items.reduce(
      (s, i) => s + i.ticketNumbers.length,
      0,
    );

    // ── Step 3: Create QPC order ──────────────────────────────────────────────
    const qpcResult = await callQpcPayinCreate({
      merchantId,
      merchantOrderNo,
      amount: amountStr,
      currency: "INR",
      signature,
      redirectUrl,
      notifyUrl,
      description: `${totalTickets} lottery ticket${totalTickets !== 1 ? "s" : ""}`,
      payer,
    });

    if (!qpcResult.ok) {
      // QPC failed — release reservations so the user can try again
      await releaseAll(user.id, reservedItems);
      console.error("[QPC create-order] QPC API error:", qpcResult.error);
      return NextResponse.json({ error: qpcResult.error }, { status: 502 });
    }

    const checkoutUrl = resolveCheckoutUrl(qpcResult.data);
    const deepLink = normalizeDeepLink(qpcResult.data.deepLink);

    if (!checkoutUrl && !deepLink?.upi_intent) {
      await releaseAll(user.id, reservedItems);
      return NextResponse.json(
        {
          error:
            "QPC did not return a payment page or UPI deep link. Contact QPC support.",
        },
        { status: 502 },
      );
    }

    // ── Step 4: Save pending payment record ─────────────────────────────────
    // This MUST succeed — the callback and status routes rely on this record
    // to fulfill tickets. If it fails, release reservations and abort.
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
      console.error("[QPC create-order] FATAL — MongoDB save failed:", dbErr);
      await releaseAll(user.id, reservedItems);
      return jsonError(
        "Unable to save your order. Please try again.",
        500,
      );
    }

    console.log(
      `[QPC create-order] Order ${merchantOrderNo} created, ${totalTickets} tickets reserved`,
    );

    return NextResponse.json({
      paymentLink: checkoutUrl,
      paymentPageUrl:
        qpcResult.data.paymentPageUrl ?? qpcResult.data.paymentUrl ?? null,
      upiId: qpcResult.data.paymentLink?.includes("@")
        ? qpcResult.data.paymentLink
        : null,
      deepLink,
      merchantOrderNo,
      platOrderNo: qpcResult.data.platOrderNo ?? null,
    });
  } catch (error) {
    // Unexpected error — release any reservations we made
    try {
      const user = await getSessionUser(request);
      if (user) await releaseAll(user.id, reservedItems);
    } catch {
      // best-effort cleanup
    }
    const msg =
      error instanceof Error ? error.message : "Unable to create payment order.";
    console.error("[QPC create-order] exception:", msg);
    return jsonError(msg);
  }
}

/** Helper: release all ticket reservations made so far in this request. */
async function releaseAll(
  userId: string,
  items: { drawId: string; tickets: string[] }[],
): Promise<void> {
  await Promise.allSettled(
    items.map(({ drawId, tickets }) =>
      releaseReservations(userId, tickets, drawId),
    ),
  );
}
