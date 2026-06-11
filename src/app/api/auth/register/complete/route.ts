import { NextRequest, NextResponse } from "next/server";
import {
  completeRegistration,
  jsonError,
  requiredEmail,
  setSessionCookie,
  validateName,
  validatePassword,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      name?: unknown;
      password?: unknown;
      registrationToken?: unknown;
    };
    const email = requiredEmail(body.email);
    const name = validateName(body.name);
    const password = validatePassword(body.password);
    const user = await completeRegistration({
      email,
      name,
      password,
      registrationToken: body.registrationToken,
    });

    const response = NextResponse.json({ user });
    setSessionCookie(response, user);
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to create account.");
  }
}
