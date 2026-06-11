import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, jsonError } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Not signed in.", 401);

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) return jsonError("Cloudinary secret not configured on server.", 500);

    // Read optional folder from request body
    let folder = "blog_thumbnails";
    try {
      const body = await request.json() as { folder?: string };
      if (body.folder) folder = body.folder;
    } catch {
      // no body is fine, use default folder
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signature: ALL upload params (except file, api_key, resource_type, type)
    // must be sorted alphabetically and concatenated as key=value pairs, then append secret.
    const paramsToSign = [`folder=${folder}`, `timestamp=${timestamp}`].sort().join("&");
    const signatureString = `${paramsToSign}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    return NextResponse.json({ signature, timestamp, folder });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Failed to generate signature.");
  }
}
