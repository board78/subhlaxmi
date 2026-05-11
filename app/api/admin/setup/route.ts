import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

/**
 * POST /api/admin/setup
 * One-time route: creates the admin account if no admin exists.
 */
export async function POST() {
  try {
    const db = await getDb();
    const existing = await db.collection("users").findOne({ role: "admin" });

    if (existing) {
      return NextResponse.json(
        { message: "Admin account already exists." },
        { status: 200 },
      );
    }

    const adminEmail = "admin@subhlaxmi.com";
    const adminPassword = "SubhAdmin@2026";
    const now = new Date();
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await db.collection("users").insertOne({
      name: "Super Admin",
      email: adminEmail,
      passwordHash,
      emailVerifiedAt: now,
      role: "admin",
      settings: { language: "en", marketingEmails: false, bookingAlerts: false },
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      message: "Admin account created successfully.",
      email: adminEmail,
      password: adminPassword,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Setup failed." },
      { status: 500 },
    );
  }
}
