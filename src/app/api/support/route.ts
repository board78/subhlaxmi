import { NextRequest, NextResponse } from "next/server";
import { sendSupportRequestEmail } from "@/lib/emails";

const MAX_FIELD_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: "Please fill in all the fields." }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
    }
    if (name.length > MAX_FIELD_LENGTH || email.length > MAX_FIELD_LENGTH || subject.length > MAX_FIELD_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ message: "Your request is too long. Please shorten it and try again." }, { status: 400 });
    }

    const result = await sendSupportRequestEmail({ name, email, subject, message });
    if (!result.delivered) {
      return NextResponse.json({ message: "We could not send your request right now. Please try again shortly." }, { status: 503 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Support API] Failed to process support request:", error);
    return NextResponse.json({ message: "Unable to submit your request. Please try again." }, { status: 500 });
  }
}
