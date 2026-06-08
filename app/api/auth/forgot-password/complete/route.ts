import { NextRequest, NextResponse } from "next/server";
import {
  completePasswordReset,
  jsonError,
  requiredEmail,
  setSessionCookie,
  validatePassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      resetToken?: unknown;
    };
    const email = requiredEmail(body.email);
    const password = validatePassword(body.password);
    const user = await completePasswordReset({
      email,
      password,
      resetToken: body.resetToken,
    });

    const response = NextResponse.json({ user });
    setSessionCookie(response, user);
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to reset password.");
  }
}
