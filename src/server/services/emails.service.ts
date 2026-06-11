import nodemailer from "nodemailer";
import type { EmailCartTicketItem } from "@/types/emails.types";



export async function sendBookingConfirmationEmail({
  email,
  name,
  orderId,
  amount,
  items,
}: {
  email: string;
  name: string;
  orderId: string;
  amount: number;
  items: EmailCartTicketItem[];
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM ?? "Subhlaxmi <no-reply@subhlaxmi.local>";

  if (!host || !user || !pass) {
    console.error("[Email Service] SMTP configuration missing. Cannot send booking email.");
    return { delivered: false, error: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587 ? true : undefined,
    family: 4, // Force IPv4 to avoid IPv6 ENETUNREACH errors
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  } as any);

  // Build items list HTML
  let itemsHtml = "";
  for (const item of items) {
    const ticketBadges = item.ticketNumbers
      .map(
        (n) =>
          `<span style="display: inline-block; background-color: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); color: #fbbf24; border-radius: 6px; padding: 4px 10px; margin: 4px 6px 4px 0; font-family: monospace; font-size: 14px; font-weight: bold;">${n}</span>`
      )
      .join("");

    itemsHtml += `
      <div style="background-color: #1c0d17; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; margin-bottom: 12px;">
          <h3 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: bold;">${item.drawName}</h3>
          <span style="background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border-radius: 9999px; padding: 2px 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">
            ${item.ticketNumbers.length} Ticket${item.ticketNumbers.length !== 1 ? "s" : ""}
          </span>
        </div>
        <p style="margin: 0 0 16px 0; color: #a1a1aa; font-size: 13px;">
          Draw Time: <strong>${new Date(item.drawDate).toLocaleDateString("en-IN")} • ${item.drawTime}</strong>
        </p>
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">Ticket Numbers</p>
          <div style="display: flex; flex-wrap: wrap;">
            ${ticketBadges}
          </div>
        </div>
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 12px; display: flex; justify-content: space-between; font-size: 12px; color: #a1a1aa;">
          <span>Price per Ticket: ₹${item.pricePerTicket}</span>
          <span style="color: #e4e4e7;">Subtotal: ₹${item.pricePerTicket * item.ticketNumbers.length}</span>
        </div>
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmed - Subhlaxmi</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #12040c; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header / Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.15em; color: #fbbf24; text-transform: uppercase;">
            SUBHLAXMI
          </h1>
          <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: rgba(255, 255, 255, 0.5);">
            Premium Lottery Portal
          </p>
        </div>

        <!-- Main Card -->
        <div style="background-color: #170610; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
          <!-- Icon & Title -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 50%; padding: 12px; margin-bottom: 16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff;">Booking Confirmed!</h2>
            <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 14px;">Hi ${name}, thank you for playing with Subhlaxmi! Your lottery tickets are successfully booked.</p>
          </div>

          <!-- Order details -->
          <div style="background-color: rgba(255, 255, 255, 0.03); border-radius: 12px; padding: 16px; margin-bottom: 28px; border-left: 3px solid #fbbf24;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="padding: 4px 0; color: #71717a; font-weight: 500;">Order ID:</td>
                <td style="padding: 4px 0; text-align: right; color: #ffffff; font-family: monospace; font-weight: bold;">${orderId}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #71717a; font-weight: 500;">Amount Paid:</td>
                <td style="padding: 4px 0; text-align: right; color: #fbbf24; font-weight: 700;">₹${amount.toFixed(2)} (incl. 18% GST)</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #71717a; font-weight: 500;">Payment Status:</td>
                <td style="padding: 4px 0; text-align: right; color: #22c55e; font-weight: bold;">SUCCESS</td>
              </tr>
            </table>
          </div>

          <!-- Items list -->
          <div style="margin-bottom: 28px;">
            <p style="margin: 0 0 16px 0; font-size: 14px; font-weight: bold; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em;">Your Tickets</p>
            ${itemsHtml}
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://bookmysubhlaxmi.com/my-tickets" style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #12040c; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 9999px; font-size: 14px; box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2); transition: all 0.2s;">
              View My Tickets on Website
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #71717a; font-size: 11px; line-height: 1.6;">
          <p style="margin: 0 0 8px 0;">This is an automated transaction confirmation. Please do not reply directly to this email.</p>
          <p style="margin: 0 0 16px 0;">If you have any questions or require assistance, please visit our <a href="https://bookmysubhlaxmi.com/support" style="color: #fbbf24; text-decoration: none;">Support Desk</a>.</p>
          <p style="margin: 0; font-weight: bold; color: #a1a1aa; letter-spacing: 0.05em;">SUBHLAXMI LOTTERY GROUP</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `Booking Confirmed! Order #${orderId} - Subhlaxmi`,
      text: `Hi ${name},\n\nYour booking of tickets for Order ID ${orderId} was successful. Total paid: ₹${amount.toFixed(2)}.\n\nVerify your tickets on https://bookmysubhlaxmi.com/my-tickets\n\nSubhlaxmi Lottery Group`,
      html: htmlContent,
    });
    console.log(`[Email Service] Booking confirmation sent to ${email} for order ${orderId}`);
    return { delivered: true };
  } catch (err) {
    console.error("[Email Service] Failed to send confirmation email:", err);
    return { delivered: false, error: err };
  }
}

export async function sendReferralEmail({
  toEmail,
  fromName,
  referralCode,
  drawName,
  ticketLink,
}: {
  toEmail: string;
  fromName: string;
  referralCode: string;
  drawName: string;
  ticketLink: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const from = process.env.SMTP_FROM ?? "Subhlaxmi <no-reply@subhlaxmi.local>";

  if (!host || !user || !pass) {
    console.error("[Email Service] SMTP configuration missing. Cannot send referral email.");
    return { delivered: false, error: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    requireTLS: port === 587 ? true : undefined,
    family: 4,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  } as any);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You have a referral from ${fromName}!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #12040c; font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e4e4e7;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header / Logo -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.15em; color: #fbbf24; text-transform: uppercase;">
            SUBHLAXMI
          </h1>
          <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.25em; color: rgba(255, 255, 255, 0.5);">
            Premium Lottery Portal
          </p>
        </div>

        <!-- Main Card -->
        <div style="background-color: #170610; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); text-align: center;">
          <div style="display: inline-block; background-color: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 50%; padding: 12px; margin-bottom: 16px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          
          <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 800; color: #ffffff;">
            ${fromName} sent you a ticket!
          </h2>
          
          <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 15px; line-height: 1.5;">
            Your friend <strong>${fromName}</strong> thinks you'll love playing the <strong>${drawName}</strong> lottery on Subhlaxmi!
          </p>

          <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(251, 191, 36, 0.4); border-radius: 12px; padding: 24px; margin-bottom: 28px;">
            <p style="margin: 0 0 8px 0; color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;">
              Use this Referral Code at checkout
            </p>
            <div style="font-family: monospace; font-size: 24px; font-weight: bold; color: #fbbf24; letter-spacing: 0.1em;">
              ${referralCode}
            </div>
          </div>

          <!-- CTA Button -->
          <div style="margin-top: 16px;">
            <a href="${ticketLink}" style="display: inline-block; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #12040c; font-weight: bold; text-decoration: none; padding: 16px 40px; border-radius: 9999px; font-size: 15px; box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2); transition: all 0.2s;">
              View Ticket Now
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; color: #71717a; font-size: 11px; line-height: 1.6;">
          <p style="margin: 0 0 16px 0;">If you have any questions, please visit our <a href="https://bookmysubhlaxmi.com/support" style="color: #fbbf24; text-decoration: none;">Support Desk</a>.</p>
          <p style="margin: 0; font-weight: bold; color: #a1a1aa; letter-spacing: 0.05em;">SUBHLAXMI LOTTERY GROUP</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: `${fromName} referred you to Subhlaxmi!`,
      text: `Hi!\n\nYour friend ${fromName} referred you to play ${drawName} on Subhlaxmi!\n\nUse Referral Code: ${referralCode} at checkout.\n\nClick here to view the ticket: ${ticketLink}\n\nSubhlaxmi Lottery Group`,
      html: htmlContent,
    });
    console.log(`[Email Service] Referral email sent to ${toEmail}`);
    return { delivered: true };
  } catch (err) {
    console.error("[Email Service] Failed to send referral email:", err);
    return { delivered: false, error: err };
  }
}
