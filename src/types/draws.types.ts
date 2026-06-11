import { ObjectId } from "mongodb";

export type DrawDoc = {
  _id: ObjectId;
  name: string;
  drawSeriesName?: string;
  drawNumber?: number;
  drawDate: Date;
  drawTime: string;
  activatesAt?: Date;
  expiresAt?: Date;
  prizeAmount?: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: "upcoming" | "active" | "closed" | "drawn";
  createdAt: Date;
  updatedAt: Date;
};

export type TicketDoc = {
  _id: ObjectId;
  drawId: ObjectId;
  series: string;
  number: string;
  numericPart: number;
  status: "available" | "sold" | "reserved";
  category: "regular" | "lp_special" | "special";
  bookedBy?: ObjectId;
  bookedAt?: Date;
  transactionId?: string;
  reservedBy?: ObjectId;
  reservedAt?: Date;
  reservationExpiresAt?: Date;
  createdAt: Date;
};

export type DrawPublic = {
  id: string;
  name: string;
  drawSeriesName?: string;
  drawNumber?: number;
  drawDate: string;
  drawTime: string;
  activatesAt: string;
  expiresAt: string;
  prizeAmount?: string;
  pricePerTicket: number;
  series: string[];
  ticketPrefix: string;
  ticketRangeStart: number;
  ticketRangeEnd: number;
  status: string;
};

export type DrawSummaryPublic = DrawPublic & {
  totalTickets: number;
  availableTickets: number;
};

export type TicketPublic = {
  id: string;
  number: string;
  numericPart: number;
  series: string;
  status: "available" | "sold";
  category: "regular" | "lp_special" | "special";
};

export type SeriesStats = {
  series: string;
  total: number;
  available: number;
  sold: number;
  lpSpecial: number;
};

export type BookingResult = {
  booked: TicketPublic[];
  failed: string[];
  total: number;
};

export type ReservationResult = {
  reserved: string[];
  failed: string[];
};
