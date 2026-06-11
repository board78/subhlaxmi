import { ObjectId } from "mongodb";

export type UserSettings = {
  language: "en" | "hi";
  marketingEmails: boolean;
  bookingAlerts: boolean;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  settings: UserSettings;
  image?: string;
  referralCode?: string;
  availableDiscounts?: number;
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

export type UserDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  emailVerifiedAt: Date;
  role: "user" | "admin";
  settings: UserSettings;
  image?: string;
  referralCode?: string;
  availableDiscounts?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailVerificationDoc = {
  _id: ObjectId;
  email: string;
  purpose: "register" | "reset_password";
  codeHash: string;
  attempts: number;
  registrationTokenHash?: string;
  resetTokenHash?: string;
  verifiedAt?: Date;
  consumedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTicketDoc = {
  _id: ObjectId;
  userId: ObjectId;
  drawName: string;
  prize: string;
  drawTime: string;
  ticketNumber: string;
  status: TicketBooking["status"];
  bookedAt: Date;
};
