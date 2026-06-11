import { NextRequest, NextResponse } from "next/server";
import { jsonError, requiredEmail, setSessionCookie, signInWithPassword, validatePassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = requiredEmail(body.email);
    const password = validatePassword(body.password);
    const user = await signInWithPassword(email, password);

    const response = NextResponse.json({ user });
    setSessionCookie(response, user);
    return response;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unable to sign in.", 401);
  }
}
