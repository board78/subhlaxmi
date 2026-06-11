import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getSessionUser, jsonError } from "@/lib/auth";
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

type CartDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  cart: CartState;
  updatedAt: Date;
};

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return jsonError("Not signed in.", 401);

  const db = await getDb();
  const doc = await db.collection<CartDoc>("carts").findOne({ userId: new ObjectId(user.id) });
  return NextResponse.json({ cart: doc?.cart ?? { items: [], updatedAt: new Date(0).toISOString() } });
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Not signed in.", 401);

    const body = (await request.json()) as { cart?: CartState };
    const cart = body.cart;
    if (!cart || !Array.isArray(cart.items) || typeof cart.updatedAt !== "string") {
      return jsonError("Invalid cart payload.");
    }

    const sanitized: CartState = {
      updatedAt: new Date().toISOString(),
      items: cart.items
        .filter((i) => i && typeof i.drawId === "string")
        .map((i) => ({
          drawId: String(i.drawId),
          drawName: String(i.drawName ?? "").slice(0, 140),
          drawDate: String(i.drawDate ?? ""),
          drawTime: String(i.drawTime ?? "").slice(0, 80),
          pricePerTicket: Number(i.pricePerTicket ?? 0),
          ticketNumbers: [...new Set((i.ticketNumbers ?? []).map(String))].slice(0, 100),
        })),
    };

    const db = await getDb();
    await db.collection<CartDoc>("carts").updateOne(
      { userId: new ObjectId(user.id) },
      { $set: { cart: sanitized, updatedAt: new Date() } },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, cart: sanitized });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to save cart.");
  }
}

