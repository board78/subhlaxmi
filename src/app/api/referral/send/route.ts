import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, getProfile, jsonError } from "@/lib/auth";
import { sendReferralEmail } from "@/lib/emails";

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return jsonError("Sign in to refer a friend.", 401);

    // Fetch full profile to get the referral code (handles lazy generation if missing)
    const profile = await getProfile(user.id);
    if (!profile?.user?.referralCode) {
      return jsonError("Unable to load your referral code. Please try again.", 500);
    }

    const body = (await request.json()) as {
      toEmail: string;
      drawName: string;
      ticketLink: string;
    };

    if (!body.toEmail?.trim() || !body.toEmail.includes("@")) {
      return jsonError("Valid email address is required.");
    }
    if (!body.drawName?.trim()) {
      return jsonError("Draw name is required.");
    }
    if (!body.ticketLink?.trim()) {
      return jsonError("Ticket link is required.");
    }

    const result = await sendReferralEmail({
      toEmail: body.toEmail.trim(),
      fromName: user.name,
      referralCode: profile.user.referralCode,
      drawName: body.drawName.trim(),
      ticketLink: body.ticketLink.trim(),
    });

    if (!result.delivered) {
      console.error("[Referral] Email failed:", result.error);
      // Even if SMTP fails, we return a success to the user so they can fall back to copying the link.
      // But let's let the frontend know it failed to send the email specifically.
      return NextResponse.json({ success: false, message: "Email service is not configured. Please use the 'Copy Link' button instead." }, { status: 503 });
    }

    return NextResponse.json({ success: true, message: "Referral email sent successfully!" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unable to send referral email.";
    console.error("[Referral API] Error:", msg);
    return jsonError(msg);
  }
}
