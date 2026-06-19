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
          `<span class="badge" style="display: inline-block; background-color: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.4); color: #fbbf24; border-radius: 4px; padding: 2px 6px; margin: 0 3px 3px 0; font-family: monospace; font-size: 10px; font-weight: bold;">${n}</span>`
      )
      .join("");

    itemsHtml += `
      <div class="ticket-box" style="background-color: rgba(0,0,0,0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 10px; margin-bottom: 8px;">
        <h3 class="ticket-title" style="margin: 0 0 4px 0; color: #ffffff; font-size: 12px; font-weight: bold;">${item.drawName}</h3>
        <p class="ticket-date" style="margin: 0 0 6px 0; color: #a1a1aa; font-size: 9px;">
          ${new Date(item.drawDate).toLocaleDateString("en-IN")} • ${item.drawTime}
        </p>
        <div style="margin-bottom: 6px;">
          ${ticketBadges}
        </div>
        <div class="subtotal" style="border-top: 1px dashed rgba(255, 255, 255, 0.15); padding-top: 6px; font-size: 9px; color: #a1a1aa;">
          ₹${item.pricePerTicket} x ${item.ticketNumbers.length} = <strong style="color:#fff;">₹${(item.pricePerTicket * item.ticketNumbers.length).toFixed(2)}</strong>
        </div>
      </div>
    `;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - Subhlaxmi</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Responsive styling for when screen is below 600px */
    @media only screen and (max-width: 600px) {
      .title-text {
        font-size: 4vw !important;
        margin-bottom: 1vw !important;
      }

      .sub-text {
        font-size: 2.5vw !important;
        margin-bottom: 2vw !important;
      }

      .order-box {
        padding: 2vw !important;
        margin-bottom: 2vw !important;
      }

      .order-label {
        font-size: 2vw !important;
      }

      .order-val {
        font-size: 3vw !important;
      }

      .ticket-box {
        padding: 2vw !important;
        margin-bottom: 2vw !important;
      }

      .ticket-title {
        font-size: 2.8vw !important;
      }

      .badge {
        font-size: 2vw !important;
        padding: 0.5vw 1vw !important;
      }

      .subtotal {
        font-size: 2vw !important;
      }

      .btn {
        padding: 1.5vw 3vw !important;
        font-size: 2.5vw !important;
      }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background-color: #0088cc; font-family: 'Outfit', 'Inter', Arial, sans-serif;">

  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0088cc;">
    <tr>
      <td align="center" valign="top" style="padding: 20px 0;">

        <!-- Main Container: Fixed Layout so content doesn't break percentages -->
        <!--[if gte mso 9]>
        <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:1066px;">
          <v:fill type="tile" src="https://subhlaxmi.in/email-bg.jpg" color="#12040c" />
          <v:textbox inset="0,0,0,0">
        <![endif]-->
        <table border="0" cellpadding="0" cellspacing="0" background="https://subhlaxmi.in/email-bg.jpg"
          style="table-layout: fixed; background-image: url('https://subhlaxmi.in/email-bg.jpg'); background-size: 100% auto; background-position: top center; background-repeat: no-repeat; width: 100%; max-width: 600px; margin: 0 auto; aspect-ratio: 9/16; background-color: #12040c;">

          <tr>
            <!-- Using a single cell with percentage padding to place the content perfectly over the phone screen on the right side -->
            <td valign="top"
              style="padding-top: 27%; padding-left: 58%; padding-right: 10%; padding-bottom: 10%; width: 100%; box-sizing: border-box;">

              <!-- Content Wrapper with Tilt -->
              <div
                style="color: #ffffff; text-align: left; background-color: transparent; transform: rotate(5.5deg); transform-origin: top left; width: 100%; word-wrap: break-word;">

                <h2 class="title-text" style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: #4ade80;">
                  Booking Confirmed!
                </h2>
                <p class="sub-text" style="margin: 0 0 10px 0; color: #e4e4e7; font-size: 11px; line-height: 1.4;">
                  Hi <strong>${name}</strong>, your tickets are secured!
                </p>

                <!-- Order Summary -->
                <div class="order-box"
                  style="background-color: rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px; margin-bottom: 12px; border-left: 3px solid #fbbf24;">
                  <p class="order-label"
                    style="margin: 0 0 4px 0; font-size: 9px; color: #a1a1aa; text-transform: uppercase;">Order ID</p>
                  <p class="order-val"
                    style="margin: 0 0 8px 0; font-size: 11px; font-weight: bold; font-family: monospace;">${orderId}
                  </p>

                  <p class="order-label"
                    style="margin: 0 0 4px 0; font-size: 9px; color: #a1a1aa; text-transform: uppercase;">Amount Paid
                  </p>
                  <p class="order-val" style="margin: 0; font-size: 12px; font-weight: bold; color: #fbbf24;">₹${amount.toFixed(2)}
                  </p>
                </div>

                <!-- Tickets -->
                <div style="margin-bottom: 10px;">
                  <p class="order-label"
                    style="margin: 0 0 6px 0; font-size: 9px; font-weight: bold; color: #ffffff; text-transform: uppercase;">
                    Your Tickets</p>

                  ${itemsHtml}

                </div>

                <!-- CTA -->
                <div style="text-align: center; margin-top: 12px;">
                  <a href="https://bookmysubhlaxmi.com/my-tickets" class="btn"
                    style="display: inline-block; background-color: #fbbf24; color: #000000; font-weight: bold; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 11px; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
                    View Tickets
                  </a>
                </div>

              </div>
            </td>
          </tr>

        </table>
        <!--[if gte mso 9]>
          </v:textbox>
        </v:rect>
        <![endif]-->

        <!-- Footer Outside the Image -->
        <table width="100%" class="main-table" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto; margin-top: 20px; max-width: 600px;">
          <tr>
            <td align="center" style="color: #ffffff; font-size: 11px; line-height: 1.6; opacity: 0.8;">
              <p style="margin: 0 0 8px 0;">This is an automated confirmation from Subhlaxmi Lottery.</p>
              <p style="margin: 0;"><strong>SUBHLAXMI LOTTERY GROUP</strong></p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
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
