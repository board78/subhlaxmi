import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, jsonError } from "@/lib/auth";
import { bookTicketsByNumbers, quickPickTickets } from "@/lib/draws";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Sign in to book tickets.", 401);

    const { id: drawId } = await params;

    const body = (await request.json()) as {
      ticketNumbers?: string[];
      quickPick?: { quantity: number; series?: string };
    };

    let result;

    if (body.quickPick) {
      const { quantity, series } = body.quickPick;
      if (!quantity || quantity < 1 || quantity > 100) {
        return jsonError("Quantity must be between 1 and 100.");
      }
      result = await quickPickTickets(user.id, drawId, quantity, series);
    } else if (body.ticketNumbers?.length) {
      result = await bookTicketsByNumbers(user.id, drawId, body.ticketNumbers);
    } else {
      return jsonError("Provide ticket numbers or a quick-pick quantity.");
    }

    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to book tickets.");
  }
}
