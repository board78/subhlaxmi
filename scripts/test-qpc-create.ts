import dotenv from "dotenv";
import { getQpcMerchantId, getQpcMerchantKey, qpcPayinSign } from "../lib/qpc";

dotenv.config();

async function testCreate(payload: any) {
  const url = process.env.QPC_API_URL || "https://portalquickpaycash.com/api/payin/create";
  console.log("Sending payload to:", url);
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    console.log("Response status:", res.status);
    console.log("Response body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function main() {
  const merchantId = getQpcMerchantId();
  const merchantKey = getQpcMerchantKey();
  if (!merchantId || !merchantKey) {
    console.error("Missing QPC credentials in env");
    return;
  }

  const merchantOrderNo = "TEST" + Date.now();
  const amount = "10.00";
  const signature = qpcPayinSign(merchantId, merchantOrderNo, amount, merchantKey);

  // Test Case A: Arjun's version (redirectUrl, notifyUrl)
  console.log("\n=== TEST CASE A (Arjun's payload) ===");
  await testCreate({
    merchantId,
    merchantOrderNo,
    amount,
    currency: "INR",
    payerName: "Test Customer",
    payerEmail: "test@example.com",
    payerMobile: "9876543210",
    description: "Test description",
    redirectUrl: "https://bookmysubhlaxmi.com/payment-status",
    notifyUrl: "https://bookmysubhlaxmi.com/api/payments/qpc/callback",
    signature,
  });

  // Test Case B: Correct version (returnUrl, callbackUrl, AND redirectUrl)
  const merchantOrderNoB = "TESTB" + Date.now();
  const signatureB = qpcPayinSign(merchantId, merchantOrderNoB, amount, merchantKey);
  console.log("\n=== TEST CASE B (returnUrl, callbackUrl + redirectUrl) ===");
  await testCreate({
    merchantId,
    merchantOrderNo: merchantOrderNoB,
    amount,
    currency: "INR",
    payerName: "Test Customer",
    payerEmail: "test@example.com",
    payerMobile: "9876543210",
    description: "Test description",
    returnUrl: "https://bookmysubhlaxmi.com/payment-status",
    callbackUrl: "https://bookmysubhlaxmi.com/api/payments/qpc/callback",
    redirectUrl: "https://bookmysubhlaxmi.com/payment-status",
    signature: signatureB,
  });
}

main().catch(console.error);
