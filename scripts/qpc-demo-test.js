/**
 * QPC Gateway — Standalone test (same as QPC team's demo)
 * Run: npm run qpc:demo
 *
 * Uses .env credentials + https://bookmysubhlaxmi.com for callback/return URLs.
 */

const https = require("https");
const crypto = require("crypto");

// ── Load from .env (Node --env-file=.env via npm script) ─────────────────────
const QPC_MERCHANT_ID = process.env.QPC_MERCHANT_ID?.trim();
const QPC_MERCHANT_KEY =
  process.env.QPC_MERCHANT_KEY?.trim() || process.env.QPC_SECRET_KEY?.trim();
const SITE_URL = (process.env.APP_URL?.trim() || "https://bookmysubhlaxmi.com").replace(/\/$/, "");

if (!QPC_MERCHANT_ID || !QPC_MERCHANT_KEY) {
  console.error("❌ Set QPC_MERCHANT_ID and QPC_SECRET_KEY (or QPC_MERCHANT_KEY) in .env");
  process.exit(1);
}

const CALLBACK_URL = `${SITE_URL}/api/payments/qpc/callback`;
const RETURN_URL_BASE = `${SITE_URL}/payment-status`;

console.log("═══════════════════════════════════════════════════════════");
console.log(" QPC Demo Test — bookmysubhlaxmi.com");
console.log("═══════════════════════════════════════════════════════════");
console.log(" Merchant ID :", QPC_MERCHANT_ID);
console.log(" Secret Key  :", QPC_MERCHANT_KEY.slice(0, 12) + "…");
console.log(" Site URL    :", SITE_URL);
console.log(" Callback URL:", CALLBACK_URL);
console.log(" Return URL  :", RETURN_URL_BASE + "?orderId=<orderId>");
console.log("═══════════════════════════════════════════════════════════\n");

function generateSignature(merchantId, merchantOrderNo, amount, merchantKey) {
  const raw = merchantId + merchantOrderNo + amount + merchantKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

function qpcPost(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: "portalquickpaycash.com",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 30000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ httpStatus: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error("Invalid JSON response (HTTP " + res.statusCode + "): " + data.slice(0, 500)));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("QPC request timed out after 30s"));
    });

    req.on("error", (e) => reject(e));
    req.write(body);
    req.end();
  });
}

async function createPayIn({ orderId, amount, payerName, payerEmail, payerMobile, callbackUrl, returnUrl }) {
  const amountStr = parseFloat(amount).toFixed(2);
  const signature = generateSignature(QPC_MERCHANT_ID, orderId, amountStr, QPC_MERCHANT_KEY);

  const payload = {
    merchantId: QPC_MERCHANT_ID,
    merchantOrderNo: orderId,
    amount: amountStr,
    currency: "INR",
    payerName: payerName || "Customer",
    payerEmail: payerEmail || "",
    payerMobile: payerMobile || "",
    description: "Payment for order " + orderId,
    returnUrl,
    callbackUrl,
    signature,
  };

  console.log("[QPC] Creating PayIn:", orderId, "Amount:", amountStr);
  console.log("[QPC] Request payload:", JSON.stringify(payload, null, 2));
  const response = await qpcPost("/api/payin/create", payload);
  console.log("[QPC] PayIn HTTP:", response.httpStatus);
  console.log("[QPC] PayIn Response:", JSON.stringify(response.body, null, 2));
  return response;
}

async function checkPayInStatus(orderId) {
  const signature = generateSignature(QPC_MERCHANT_ID, orderId, "", QPC_MERCHANT_KEY);
  const payload = {
    merchantId: QPC_MERCHANT_ID,
    merchantOrderNo: orderId,
    signature,
  };
  console.log("\n[QPC] Checking PayIn status:", orderId);
  const response = await qpcPost("/api/payin/status", payload);
  console.log("[QPC] Status HTTP:", response.httpStatus);
  console.log("[QPC] Status Response:", JSON.stringify(response.body, null, 2));
  return response;
}

function verifyWebhook(body, merchantKey) {
  const orderId = body.orderId || body.platOrderNo || "";
  const merchantOrderNo = body.merchantOrderNo || "";
  const status = body.status || body.orderStatus || "";
  const signature = body.signature || body.sign || "";
  const raw = orderId + merchantOrderNo + status + merchantKey;
  const expected = crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
  const ok = signature.toUpperCase() === expected;
  console.log("\n[QPC] Webhook verify:", ok ? "✅ VALID" : "❌ MISMATCH");
  console.log("  orderId:", orderId, "| status:", status, "| sign match:", ok);
  return ok;
}

/** Quick check that your callback URL is reachable from this machine */
async function testCallbackReachable() {
  return new Promise((resolve) => {
    const url = new URL(CALLBACK_URL);
    const body = JSON.stringify({
      merchantOrderNo: "PING",
      status: "PENDING",
      signature: "test",
    });
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        console.log("[Site] Callback URL reachable — HTTP", res.statusCode, data.slice(0, 80));
        resolve(res.statusCode === 200);
      });
    });
    req.on("error", (e) => {
      console.log("[Site] Callback URL error:", e.message);
      resolve(false);
    });
    req.on("timeout", () => {
      req.destroy();
      console.log("[Site] Callback URL timed out");
      resolve(false);
    });
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log("Step 1 — Test your callback URL on Render/production\n");
  await testCallbackReachable();

  console.log("\nStep 2 — Create PayIn on QPC (same as team demo)\n");
  try {
    const orderId = "ORD_" + Date.now();
    const returnUrl = `${RETURN_URL_BASE}?orderId=${orderId}`;

    const { httpStatus, body: result } = await createPayIn({
      orderId,
      amount: "100.00",
      payerName: "Test User",
      payerEmail: "test@bookmysubhlaxmi.com",
      payerMobile: "9999999999",
      callbackUrl: CALLBACK_URL,
      returnUrl,
    });

    if (result.cloudflare_error || httpStatus === 502) {
      console.log("\n❌ QPC SERVER DOWN (502 / Cloudflare)");
      console.log("   This is on QPC's side — share this output with QPC support.");
      console.log("   Also confirm they whitelisted your Render outbound IP.");
      process.exit(1);
    }

    if (String(result.status) === "200" && result.data) {
      console.log("\n✅ PAYIN CREATE SUCCESS!");
      const payUrl =
        result.data.paymentUrl ||
        result.data.paymentPageUrl ||
        result.data.paymentLink;
      if (payUrl) console.log("   Payment URL:", payUrl);
      if (result.data.deepLink) console.log("   Deep links:", JSON.stringify(result.data.deepLink));

      await checkPayInStatus(orderId);

      console.log("\nStep 3 — Webhook signature example (demo formula)\n");
      verifyWebhook(
        {
          orderId: result.data.platOrderNo || "",
          merchantOrderNo: orderId,
          status: "SUCCESS",
          signature: "PLACEHOLDER",
        },
        QPC_MERCHANT_KEY,
      );
      console.log("   (Real callbacks from QPC will include a valid signature)");
    } else {
      console.log("\n❌ PAYIN FAILED:", result.message || JSON.stringify(result));
      process.exit(1);
    }
  } catch (e) {
    console.error("\n❌ ERROR:", e.message);
    if (e.message.includes("timed out") || e.message.includes("ECONNREFUSED")) {
      console.log("\n   Cannot reach portalquickpaycash.com from this network.");
      console.log("   Run this script ON Render (or ask QPC to whitelist your IP).");
    }
    process.exit(1);
  }
}

main();
