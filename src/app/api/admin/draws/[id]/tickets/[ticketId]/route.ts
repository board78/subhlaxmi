import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import type { TicketDoc } from "@/lib/draws";
import { ObjectId } from "mongodb";

/**
 * PATCH  /api/admin/draws/[id]/tickets/[ticketId]  — update ticket (status, category)
 * DELETE /api/admin/draws/[id]/tickets/[ticketId]  — delete single ticket
 */

type Params = { params: Promise<{ id: string; ticketId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { ticketId } = await params;
    if (!ObjectId.isValid(ticketId)) return jsonError("Invalid ticket ID.");

    const body = (await request.json()) as {
      status?: string;
      category?: string;
    };

    const $set: Record<string, unknown> = {};
    if (body.status === "available" || body.status === "sold") $set.status = body.status;
    if (
      body.category === "regular" ||
      body.category === "lp_special" ||
      body.category === "special"
    )
      $set.category = body.category;

    if (!Object.keys($set).length) return jsonError("Nothing to update.");

    const db = await getDb();
    const result = await db
      .collection<TicketDoc>("tickets")
      .updateOne({ _id: new ObjectId(ticketId) }, { $set });

    if (result.matchedCount === 0) return jsonError("Ticket not found.", 404);
    return NextResponse.json({ message: "Ticket updated." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to update ticket.", 403);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { ticketId } = await params;
    if (!ObjectId.isValid(ticketId)) return jsonError("Invalid ticket ID.");

    const db = await getDb();
    await db.collection<TicketDoc>("tickets").deleteOne({ _id: new ObjectId(ticketId) });

    return NextResponse.json({ message: "Ticket deleted." });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to delete ticket.", 403);
  }
}
