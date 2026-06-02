import crypto from "crypto";
import { normalizeEmail, normalizeIndianMobile } from "./auth";

export const QPC_PAYIN_CREATE_URL =
  process.env.QPC_API_URL?.trim() || "https://portalquickpaycash.com/api/payin/create";

export const QPC_PAYIN_STATUS_URL =
  process.env.QPC_STATUS_API_URL?.trim() || "https://portalquickpaycash.com/api/payin/status";

export type QpcDeepLink = {
  upi_intent?: string;
  upi_phonepe?: string;
  upi_gpay?: string;
  upi_paytm?: string;
};

export type QpcCreateData = {
  paymentLink?: string;
  paymentPageUrl?: string;
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
  orderMessage?: string;
};

export type QpcPayerInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

/** MD5(merchantId + merchantOrderNo + amount + merchantKey).toUpperCase() */
export function qpcPayinSign(
  merchantId: string,
  merchantOrderNo: string,
  amount: string,
  merchantKey: string,
) {
  const raw = merchantId + merchantOrderNo + amount + merchantKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

export function verifyPayinCallbackSign(
  merchantId: string,
  merchantOrderNo: string,
  amount: string | number | undefined,
  sign: string,
  merchantKey: string,
): boolean {
  if (!sign?.trim()) return false;
  const expected = qpcPayinSign(merchantId, merchantOrderNo, String(amount ?? ""), merchantKey);
  return expected === sign.trim();
}

export function getQpcMerchantKey() {
  return (
    process.env.QPC_MERCHANT_KEY?.trim() ||
    process.env.QPC_SECRET_KEY?.trim() ||
    ""
  );
}

export function getQpcMerchantId() {
  return process.env.QPC_MERCHANT_ID?.trim() ?? "";
}

/** Build optional payer fields per QPC docs — omit when not available. */
export function buildPayinPayerFields(payer: QpcPayerInput): {
  payerName?: string;
  payerEmail?: string;
  payerMobile?: string;
} {
  const out: { payerName?: string; payerEmail?: string; payerMobile?: string } = {};

  const name = typeof payer.name === "string" ? payer.name.trim().slice(0, 50) : "";
  if (name.length >= 2) out.payerName = name;

  const email = payer.email ? normalizeEmail(payer.email) : null;
  if (email) out.payerEmail = email;

  const mobile = payer.phone ? normalizeIndianMobile(payer.phone) : null;
  if (mobile) out.payerMobile = mobile;

  return out;
}

export function buildPayinCreateBody(input: {
  merchantId: string;
  merchantOrderNo: string;
  amount: string;
  currency: string;
  signature: string;
  returnUrl: string;
  callbackUrl: string;
  description?: string;
  payer?: QpcPayerInput;
}): Record<string, string> {
  const body: Record<string, string> = {
    merchantId: input.merchantId,
    merchantOrderNo: input.merchantOrderNo,
    amount: input.amount,
    currency: input.currency,
    returnUrl: input.returnUrl,
    callbackUrl: input.callbackUrl,
    signature: input.signature,
  };

  if (input.description?.trim()) {
    body.description = input.description.trim().slice(0, 200);
  }

  const payerFields = buildPayinPayerFields(input.payer ?? {});
  Object.assign(body, payerFields);

  return body;
}

export function resolveCheckoutUrl(data: QpcCreateData): string | null {
  const page = data.paymentPageUrl?.trim();
  if (page && (page.startsWith("http://") || page.startsWith("https://"))) return page;

  const link = data.paymentLink?.trim();
  if (link && (link.startsWith("http://") || link.startsWith("https://"))) return link;

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

async function readQpcJson<T>(res: Response): Promise<{ ok: true; body: T } | { ok: false; error: string }> {
  const text = await res.text();
  if (!text.trim()) {
    return { ok: false, error: `QPC returned empty (HTTP ${res.status}).` };
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
      return { ok: false, error: body.message ?? `QPC error (${body.status ?? "unknown"}).` };
    }
    return { ok: true, body };
  } catch {
    return { ok: false, error: `QPC unexpected response (HTTP ${res.status}).` };
  }
}

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
  try {
    const body = buildPayinCreateBody(input);
    const res = await fetch(QPC_PAYIN_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    const parsed = await readQpcJson<QpcCreateResponse>(res);
    if (!parsed.ok) return parsed;
    if (!parsed.body.data) {
      return { ok: false, error: parsed.body.message ?? "QPC did not return order data." };
    }
    return { ok: true, data: parsed.body.data };
  } catch (err) {
    const error =
      err instanceof Error && err.name === "TimeoutError"
        ? "QPC payment server timed out. Please try again."
        : "Could not connect to QPC payment server. Please check your internet and try again.";
    return { ok: false, error };
  }
}

export async function callQpcPayinStatus(
  merchantOrderNo: string,
): Promise<{ ok: true; data: QpcPayinStatusData } | { ok: false; error: string }> {
  try {
    const res = await fetch(QPC_PAYIN_STATUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ merchantOrderNo }),
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
