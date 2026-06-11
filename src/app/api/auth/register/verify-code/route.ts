import { NextRequest, NextResponse } from "next/server";
import { jsonError, requiredEmail, verifyRegistrationOtp } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown; code?: unknown };
    const email = requiredEmail(body.email);
    const registrationToken = await verifyRegistrationOtp(email, body.code);

    return NextResponse.json({
      message: "Email verified. Create your password to finish registration.",
      registrationToken,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to verify code.");
  }
}
