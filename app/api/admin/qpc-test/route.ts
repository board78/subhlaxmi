import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, jsonError } from "@/lib/auth";
import {
  callQpcPayinCreate,
  callQpcPayinStatus,
  generateMerchantOrderNo,
  getQpcMerchantId,
  getQpcMerchantKey,
  qpcPayinSign,
} from "@/lib/qpc";
import { getPublicAppOrigin } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);

    const body = (await request.json()) as { action?: string; orderId?: string };
    const merchantId = getQpcMerchantId();
    const merchantKey = getQpcMerchantKey();

    if (!merchantId || !merchantKey) {
      return jsonError("QPC credentials not set in .env", 500);
    }

    const origin = getPublicAppOrigin(request);

    // ── Action: create a test PayIn ───────────────────────────────────────────
    if (body.action === "create") {
      const merchantOrderNo = generateMerchantOrderNo();
      const amount = "1.00";
      const signature = qpcPayinSign(merchantId, merchantOrderNo, amount, merchantKey);
      const startMs = Date.now();

      const result = await callQpcPayinCreate({
        merchantId,
        merchantOrderNo,
        amount,
        currency: "INR",
        signature,
        returnUrl: `${origin}/payment-status?orderId=${merchantOrderNo}`,
        callbackUrl: `${origin}/api/payments/qpc/callback`,
        description: "QPC connectivity test",
        payer: { name: "Test Admin", email: "admin@bookmysubhlaxmi.com", phone: "9999999999" },
      });

      return NextResponse.json({
        action: "create",
        merchantId,
        merchantOrderNo,
        elapsed_ms: Date.now() - startMs,
        ok: result.ok,
        data: result.ok ? result.data : undefined,
        error: result.ok ? undefined : result.error,
      });
    }

    // ── Action: check status ──────────────────────────────────────────────────
    if (body.action === "status" && body.orderId) {
      const result = await callQpcPayinStatus(body.orderId);
      return NextResponse.json({ action: "status", orderId: body.orderId, result });
    }

    // ── Action: balance check ─────────────────────────────────────────────────
    if (body.action === "balance") {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = qpcPayinSign(merchantId, timestamp, "", merchantKey);

      const payload = { merchantNo: merchantId, timestamp, sign: signature };
      const apiUrl = "https://portalquickpaycash.com/api/balance";

      let httpStatus = 0;
      let parsedJson: unknown = null;
      let networkError = "";
      const startMs = Date.now();

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15_000),
        });
        httpStatus = res.status;
        const text = await res.text();
        try { parsedJson = JSON.parse(text); } catch { parsedJson = text; }
      } catch (err) {
        networkError = err instanceof Error ? err.message : "Unknown fetch error";
      }

      return NextResponse.json({
        action: "balance",
        elapsed_ms: Date.now() - startMs,
        httpStatus,
        response: parsedJson,
        networkError: networkError || undefined,
      });
    }

    return jsonError("Unknown action. Use: create | status | balance");
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Test failed.", 403);
  }
}
