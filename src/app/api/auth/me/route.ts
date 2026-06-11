import { NextRequest, NextResponse } from "next/server";
import { getProfile, getSessionUser, jsonError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return jsonError("Not signed in.", 401);

  const profile = await getProfile(user.id);
  if (!profile) return jsonError("User profile not found.", 404);

  return NextResponse.json(profile);
}
