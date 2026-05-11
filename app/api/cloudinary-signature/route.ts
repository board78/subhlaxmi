import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, jsonError } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Not signed in.", 401);

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) return jsonError("Cloudinary secret not configured on server.", 500);

    const timestamp = Math.floor(Date.now() / 1000);

    // According to Cloudinary docs, signature is a SHA-1 hash of parameters sorted alphabetically.
    // We are only sending 'timestamp'.
    const signatureString = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    return NextResponse.json({ signature, timestamp });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to generate signature.");
  }
}
