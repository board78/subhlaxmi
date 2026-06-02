import crypto from "crypto";

export const QPC_PAYIN_CREATE_URL =
  process.env.QPC_API_URL?.trim() || "https://portalquickpaycash.com/api/payin/create";

export const QPC_PAYIN_STATUS_URL =
  process.env.QPC_STATUS_API_URL?.trim() || "https://portalquickpaycash.com/api/payin/status";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QpcDeepLink = {
  upi_intent?: string;
  upi_phonepe?: string;
  upi_gpay?: string;
  upi_paytm?: string;
};

export type QpcCreateData = {
  paymentLink?: string;
  paymentPageUrl?: string;
  paymentUrl?: string;       // some QPC responses use this field name
  paymentImage?: string | null;
  platOrderNo?: string;
  orderStatus?: string;
  payAmount?: number;
  deepLink?: QpcDeepLink;
};

export type QpcCreateResponse = {
  status?: string | number;
  message?: string;
  data?: QpcCreateData;
  cloudflare_error?: boolean;
  title?: string;
  detail?: string;
};

export type QpcPayinStatusData = {
  merchantOrderNo?: string;
  platOrderNo?: string;
  utr?: string;
  amount?: number;
  merchantFee?: number;
  orderStatus?: string;
  status?: string;           // demo uses 'status', docs use 'orderStatus'
  orderMessage?: string;
};

export type QpcPayerInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

// ─── Signature ────────────────────────────────────────────────────────────────

/** MD5(merchantId + merchantOrderNo + amount + merchantKey).toUpperCase() */
export function qpcPayinSign(
  merchantId: string,
  merchantOrderNo: string,
  amount: string,
  merchantKey: string,
): string {
  const raw = merchantId + merchantOrderNo + amount + merchantKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

/**
 * Verify webhook callback signature per QPC demo:
 *   MD5(orderId + merchantOrderNo + status + merchantKey).toUpperCase()
 *
 * orderId    = body.orderId   || body.platOrderNo
 * status     = body.status    || body.orderStatus
 * signature  = body.signature || body.sign
 */
export function verifyCallbackSign(
  orderId: string,
  merchantOrderNo: string,
  status: string,
  signature: string,
  merchantKey: string,
): boolean {
  if (!signature?.trim()) return false;
  const raw = orderId + merchantOrderNo + status + merchantKey;
  const expected = crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
  return expected === signature.trim().toUpperCase();
}

// ─── Credentials ──────────────────────────────────────────────────────────────

export function getQpcMerchantKey(): string {
  return (
    process.env.QPC_MERCHANT_KEY?.trim() ||
    process.env.QPC_SECRET_KEY?.trim() ||
    ""
  );
}

export function getQpcMerchantId(): string {
  return process.env.QPC_MERCHANT_ID?.trim() ?? "";
}

// ─── Payer fields ─────────────────────────────────────────────────────────────

/**
 * Per QPC demo: always include all three payer fields.
 * Fall back to 'Customer' / '' / '' when not available.
 */
export function buildPayerFields(payer: QpcPayerInput): {
  payerName: string;
  payerEmail: string;
  payerMobile: string;
} {
  const name = typeof payer.name === "string" ? payer.name.trim().slice(0, 50) : "";
  const email = typeof payer.email === "string" ? payer.email.trim() : "";
  const mobile = typeof payer.phone === "string" ? payer.phone.replace(/\D/g, "").slice(-10) : "";

  return {
    payerName: name || "Customer",
    payerEmail: email,
    payerMobile: mobile,
  };
}

// ─── Checkout URL resolution ──────────────────────────────────────────────────

/** Prefer paymentUrl → paymentPageUrl → paymentLink (first valid http/https URL). */
export function resolveCheckoutUrl(data: QpcCreateData): string | null {
  for (const val of [data.paymentUrl, data.paymentPageUrl, data.paymentLink]) {
    const v = val?.trim();
    if (v && (v.startsWith("http://") || v.startsWith("https://"))) return v;
  }
  return null;
}

export function normalizeDeepLink(dl?: QpcDeepLink): QpcDeepLink | null {
  if (!dl) return null;
  const out: QpcDeepLink = {};
  if (dl.upi_intent?.trim()) out.upi_intent = dl.upi_intent.trim();
  if (dl.upi_phonepe?.trim()) out.upi_phonepe = dl.upi_phonepe.trim();
  if (dl.upi_gpay?.trim()) out.upi_gpay = dl.upi_gpay.trim();
  if (dl.upi_paytm?.trim()) out.upi_paytm = dl.upi_paytm.trim();
  return Object.keys(out).length ? out : null;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function readQpcJson<T>(res: Response): Promise<{ ok: true; body: T } | { ok: false; error: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false, error: `QPC returned empty body (HTTP ${res.status}).` };
  }
  if (text.trim().startsWith("<")) {
    return { ok: false, error: `QPC gateway error (HTTP ${res.status}).` };
  }
  try {
    const body = JSON.parse(text) as T & {
      status?: string | number;
      message?: string;
      cloudflare_error?: boolean;
      title?: string;
      detail?: string;
    };
    if (body.cloudflare_error || String(body.status) === "502") {
      return {
        ok: false,
        error:
          body.detail ??
          body.title ??
          "QPC payment server is temporarily down. Please try again shortly.",
      };
    }
    if (String(body.status) !== "200") {
      return { ok: false, error: body.message ?? `QPC error (status ${body.status ?? "unknown"}).` };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, error: `QPC unexpected response (HTTP ${res.status}).` };
  }
}

// ─── Create PayIn ─────────────────────────────────────────────────────────────

export async function callQpcPayinCreate(input: {
  merchantId: string;
  merchantOrderNo: string;
  amount: string;
  currency: string;
  signature: string;
  returnUrl: string;
  callbackUrl: string;
  description?: string;
  payer?: QpcPayerInput;
}): Promise<{ ok: true; data: QpcCreateData } | { ok: false; error: string }> {
  const payer = buildPayerFields(input.payer ?? {});

  const payload: Record<string, string> = {
    merchantId:      input.merchantId,
    merchantOrderNo: input.merchantOrderNo,
    amount:          input.amount,
    currency:        input.currency,
    payerName:       payer.payerName,
    payerEmail:      payer.payerEmail,
    payerMobile:     payer.payerMobile,
    description:     input.description?.trim() || "Payment for order " + input.merchantOrderNo,
    returnUrl:       input.returnUrl,
    callbackUrl:     input.callbackUrl,
    signature:       input.signature,
  };

  console.log("[QPC] Creating PayIn:", input.merchantOrderNo, "amount:", input.amount);

  try {
    const res = await fetch(QPC_PAYIN_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    const parsed = await readQpcJson<QpcCreateResponse>(res);
    if (!parsed.ok) return parsed;
    if (!parsed.body.data) {
      return { ok: false, error: parsed.body.message ?? "QPC did not return order data." };
    }
    console.log("[QPC] PayIn response:", JSON.stringify(parsed.body.data));
    return { ok: true, data: parsed.body.data };
  } catch (err) {
    const error =
      err instanceof Error && err.name === "TimeoutError"
        ? "QPC payment server timed out. Please try again."
        : "Could not connect to QPC payment server. Please check your internet and try again.";
    return { ok: false, error };
  }
}

// ─── Query PayIn Status ───────────────────────────────────────────────────────

/**
 * Per QPC demo: status check requires merchantId + signature (amount = "").
 *   signature = MD5(merchantId + merchantOrderNo + "" + merchantKey).toUpperCase()
 */
export async function callQpcPayinStatus(
  merchantOrderNo: string,
): Promise<{ ok: true; data: QpcPayinStatusData } | { ok: false; error: string }> {
  const merchantId = getQpcMerchantId();
  const merchantKey = getQpcMerchantKey();
  const signature = qpcPayinSign(merchantId, merchantOrderNo, "", merchantKey);

  try {
    const res = await fetch(QPC_PAYIN_STATUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ merchantId, merchantOrderNo, signature }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });

    const parsed = await readQpcJson<{ data?: QpcPayinStatusData; message?: string }>(res);
    if (!parsed.ok) return parsed;
    if (!parsed.body.data) {
      return { ok: false, error: "QPC status response missing data." };
    }
    return { ok: true, data: parsed.body.data };
  } catch {
    return { ok: false, error: "Unable to reach QPC status API." };
  }
}
