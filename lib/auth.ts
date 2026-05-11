import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, OptionalUnlessRequiredId } from "mongodb";
import { getDb } from "./mongodb";

export const SESSION_COOKIE = "subhlaxmi_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OTP_MAX_AGE_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export type UserSettings = {
  language: "en" | "hi";
  marketingEmails: boolean;
  bookingAlerts: boolean;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  settings: UserSettings;
  image?: string;
  createdAt: string;
};

export type TicketBooking = {
  id: string;
  drawName: string;
  prize: string;
  drawTime: string;
  ticketNumber: string;
  status: "booked" | "draw_pending" | "won" | "lost";
  bookedAt: string;
};

type UserDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  emailVerifiedAt: Date;
  role: "user" | "admin";
  settings: UserSettings;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
};

type EmailVerificationDoc = {
  _id: ObjectId;
  email: string;
  purpose: "register";
  codeHash: string;
  attempts: number;
  registrationTokenHash?: string;
  verifiedAt?: Date;
  consumedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

type TicketDoc = {
  _id: ObjectId;
  userId: ObjectId;
  drawName: string;
  prize: string;
  drawTime: string;
  ticketNumber: string;
  status: TicketBooking["status"];
  bookedAt: Date;
};

function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? "dev-only-change-this-auth-secret";
}

function hmac(value: string): string {
  return createHmac("sha256", getAuthSecret()).update(value).digest("hex");
}

function hashOtp(email: string, code: string): string {
  return hmac(`${email.toLowerCase()}:${code}`);
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function normalizeEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const value = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

export function requiredEmail(email: unknown): string {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error("Enter a valid email address.");
  return normalized;
}

export function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  return password;
}

export function validateName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new Error("Enter your full name.");
  }
  return name.trim().slice(0, 80);
}

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export async function requestRegistrationOtp(email: string) {
  const db = await getDb();
  const existingUser = await db.collection<UserDoc>("users").findOne({ email });

  if (existingUser) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const code = randomInt(100000, 1000000).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_MAX_AGE_MINUTES * 60 * 1000);

  await db.collection<EmailVerificationDoc>("email_verifications").updateOne(
    { email, purpose: "register" },
    {
      $set: {
        codeHash: hashOtp(email, code),
        attempts: 0,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      },
      $unset: {
        registrationTokenHash: "",
        verifiedAt: "",
        consumedAt: "",
      },
    },
    { upsert: true },
  );

  const delivery = await sendVerificationEmail(email, code);
  return {
    expiresInMinutes: OTP_MAX_AGE_MINUTES,
    ...delivery,
  };
}

export async function verifyRegistrationOtp(email: string, code: unknown) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
    throw new Error("Enter the 6 digit verification code.");
  }

  const db = await getDb();
  const verification = await db.collection<EmailVerificationDoc>("email_verifications").findOne({
    email,
    purpose: "register",
    consumedAt: { $exists: false },
  });

  if (!verification || verification.expiresAt.getTime() < Date.now()) {
    throw new Error("Verification code expired. Please request a new code.");
  }

  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new Error("Too many attempts. Please request a new code.");
  }

  const matches = safeCompare(verification.codeHash, hashOtp(email, code.trim()));

  if (!matches) {
    await db
      .collection<EmailVerificationDoc>("email_verifications")
      .updateOne({ _id: verification._id }, { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } });
    throw new Error("Incorrect verification code.");
  }

  const registrationToken = randomBytes(32).toString("hex");
  await db.collection<EmailVerificationDoc>("email_verifications").updateOne(
    { _id: verification._id },
    {
      $set: {
        registrationTokenHash: hmac(registrationToken),
        verifiedAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  return registrationToken;
}

export async function completeRegistration({
  email,
  name,
  password,
  registrationToken,
}: {
  email: string;
  name: string;
  password: string;
  registrationToken: unknown;
}): Promise<SafeUser> {
  if (typeof registrationToken !== "string" || registrationToken.length < 32) {
    throw new Error("Email verification is required before creating your password.");
  }

  const db = await getDb();
  const verification = await db.collection<EmailVerificationDoc>("email_verifications").findOne({
    email,
    purpose: "register",
    consumedAt: { $exists: false },
    registrationTokenHash: hmac(registrationToken),
  });

  if (!verification || verification.expiresAt.getTime() < Date.now()) {
    throw new Error("Verification expired. Please verify your email again.");
  }

  const existingUser = await db.collection<UserDoc>("users").findOne({ email });
  if (existingUser) {
    throw new Error("An account with this email already exists. Please sign in.");
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(password, 12);
  const settings: UserSettings = {
    language: "en",
    marketingEmails: false,
    bookingAlerts: true,
  };

  const newUser: OptionalUnlessRequiredId<UserDoc> = {
    name,
    email,
    passwordHash,
    emailVerifiedAt: now,
    role: "user",
    settings,
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection<UserDoc>("users").insertOne(newUser);

  await db
    .collection<EmailVerificationDoc>("email_verifications")
    .updateOne({ _id: verification._id }, { $set: { consumedAt: now, updatedAt: now } });

  return {
    id: result.insertedId.toString(),
    name,
    email,
    role: "user",
    settings,
    createdAt: now.toISOString(),
  };
}

export async function signInWithPassword(email: string, password: string): Promise<SafeUser> {
  const db = await getDb();
  const user = await db.collection<UserDoc>("users").findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new Error("Invalid email or password.");
  }

  return toSafeUser(user);
}

export function setSessionCookie(response: NextResponse, user: SafeUser) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = Buffer.from(JSON.stringify({ userId: user.id, email: user.email, exp: expiresAt })).toString(
    "base64url",
  );
  const signature = hmac(payload);

  response.cookies.set(SESSION_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(request: NextRequest): Promise<SafeUser | null> {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature || !safeCompare(signature, hmac(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      userId?: string;
      exp?: number;
    };
    if (!parsed.userId || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    if (!ObjectId.isValid(parsed.userId)) return null;

    const db = await getDb();
    const user = await db.collection<UserDoc>("users").findOne({ _id: new ObjectId(parsed.userId) });
    return user ? toSafeUser(user) : null;
  } catch {
    return null;
  }
}

export async function getProfile(userId: string) {
  const db = await getDb();
  const userObjectId = new ObjectId(userId);
  const user = await db.collection<UserDoc>("users").findOne({ _id: userObjectId });
  if (!user) return null;

  const tickets = await db
    .collection<TicketDoc>("tickets")
    .find({ userId: userObjectId })
    .sort({ bookedAt: -1 })
    .limit(25)
    .toArray();

  return {
    user: toSafeUser(user),
    tickets: tickets.map(toTicketBooking),
  };
}

export async function updateProfileSettings(userId: string, input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Invalid settings payload.");
  const body = input as Partial<{ name: unknown; image: unknown; settings: Partial<UserSettings> }>;

  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    $set.name = body.name.trim().slice(0, 80);
  }
  if (typeof body.image === "string") {
    $set.image = body.image.trim();
  }

  if (body.settings) {
    if (body.settings.language === "en" || body.settings.language === "hi") {
      $set["settings.language"] = body.settings.language;
    }
    if (typeof body.settings.marketingEmails === "boolean") {
      $set["settings.marketingEmails"] = body.settings.marketingEmails;
    }
    if (typeof body.settings.bookingAlerts === "boolean") {
      $set["settings.bookingAlerts"] = body.settings.bookingAlerts;
    }
  }

  const db = await getDb();
  await db.collection<UserDoc>("users").updateOne({ _id: new ObjectId(userId) }, { $set });
  return getProfile(userId);
}

export async function createTicketBooking(
  userId: string,
  ticket: Pick<TicketBooking, "drawName" | "prize" | "drawTime">,
) {
  const db = await getDb();
  const bookedAt = new Date();
  const doc: Omit<TicketDoc, "_id"> = {
    userId: new ObjectId(userId),
    drawName: ticket.drawName.slice(0, 120),
    prize: ticket.prize.slice(0, 60),
    drawTime: ticket.drawTime.slice(0, 80),
    ticketNumber: `SL-${randomInt(100000, 999999)}`,
    status: "draw_pending",
    bookedAt,
  };

  const result = await db.collection<TicketDoc>("tickets").insertOne(doc as TicketDoc);
  return toTicketBooking({ ...doc, _id: result.insertedId });
}

function toSafeUser(doc: UserDoc): SafeUser {
  if (!doc._id) {
    throw new Error("User record is missing an id.");
  }
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role ?? "user",
    settings: doc.settings ?? { language: "en", marketingEmails: false, bookingAlerts: true },
    image: doc.image,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getSessionUser(request);
  return user?.role === "admin";
}

export async function requireAdmin(request: NextRequest): Promise<SafeUser> {
  const user = await getSessionUser(request);
  if (!user) throw new Error("Authentication required.");
  if (user.role !== "admin") throw new Error("Admin access required.");
  return user;
}

function toTicketBooking(ticket: TicketDoc): TicketBooking {
  return {
    id: ticket._id.toString(),
    drawName: ticket.drawName,
    prize: ticket.prize,
    drawTime: ticket.drawTime,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    bookedAt: ticket.bookedAt.toISOString(),
  };
}

async function sendVerificationEmail(email: string, code: string) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM ?? "Subhlaxmi <no-reply@subhlaxmi.local>";

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email service is not configured.");
    }
    return { delivered: false, devCode: code };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587 ? true : undefined,
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your Subhlaxmi account",
    text: `Your Subhlaxmi verification code is ${code}. It expires in ${OTP_MAX_AGE_MINUTES} minutes.`,
    html: `<p>Your Subhlaxmi verification code is <strong>${code}</strong>.</p><p>It expires in ${OTP_MAX_AGE_MINUTES} minutes.</p>`,
  });

  return { delivered: true };
}
