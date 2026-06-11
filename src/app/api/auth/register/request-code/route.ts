import { NextRequest, NextResponse } from "next/server";
import { jsonError, requestRegistrationOtp, requiredEmail } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = requiredEmail(body.email);
    const result = await requestRegistrationOtp(email);

    return NextResponse.json({
      message: result.delivered
        ? "Verification code sent to your email."
        : "Email service is not configured locally. Use the dev code to continue.",
      ...result,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to send verification code.");
  }
}
