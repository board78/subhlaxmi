import crypto from "crypto";
import https from "https";

export const QPC_HOST = "portalquickpaycash.com";
export const QPC_PAYIN_CREATE_PATH = "/api/payin/create";
export const QPC_PAYIN_STATUS_PATH = "/api/payin/status";

export type QpcDeepLink = {
  upi_intent?: string;
  upi_phonepe?: string;
  upi_gpay?: string;
  upi_paytm?: string;
};

export type QpcCreateData = {
  paymentLink?: string;
  paymentPageUrl?: string;
  paymentUrl?: string;
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
  status?: string;
  orderMessage?: string;
  deepLink?: QpcDeepLink;
  paymentLink?: string;
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
): string {
  const raw = merchantId + merchantOrderNo + amount + merchantKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

/** Demo webhook: MD5(orderId + merchantOrderNo + status + merchantKey) */
export function qpcCallbackSignDemo(
  orderId: string,
  merchantOrderNo: string,
  status: string,
  merchantKey: string,
): string {
  const raw = orderId + merchantOrderNo + status + merchantKey;
  return crypto.createHash("md5").update(raw).digest("hex").toUpperCase();
}

/** Docs webhook: MD5(merchantId + merchantOrderNo + amount + merchantKey) */
export function qpcCallbackSignDocs(
  merchantId: string,
  merchantOrderNo: string,
  amount: string,
  merchantKey: string,
): string {
  return qpcPayinSign(merchantId, merchantOrderNo, amount, merchantKey);
}

export function verifyCallbackSign(body: {
  orderId?: string;
  platOrderNo?: string;
  merchantNo?: string;
  merchantOrderNo?: string;
  orderStatus?: string;
  status?: string;
  amount?: string | number;
  sign?: string;
  signature?: string;
}, merchantId: string, merchantKey: string): boolean {
  const sig = (body.signature || body.sign || "").trim().toUpperCase();
  if (!sig) return false;

  const merchantOrderNo = body.merchantOrderNo || "";
  const orderId = body.orderId || body.platOrderNo || "";
  const status = (body.status || body.orderStatus || "").trim().toUpperCase();
  const amount = String(body.amount ?? "");

  const demoExpected = qpcCallbackSignDemo(orderId, merchantOrderNo, status, merchantKey);
  if (sig === demoExpected) return true;

  const docsExpected = qpcCallbackSignDocs(merchantId, merchantOrderNo, amount, merchantKey);
  if (sig === docsExpected) return true;

  return false;
}

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

/** Same order ID style as QPC demo: ORD_<timestamp> */
export function generateMerchantOrderNo(): string {
  return `ORD_${Date.now()}`.slice(0, 50);
}

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
    payerEmail: email || "",
    payerMobile: mobile || "",
  };
}

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

/** HTTPS POST — identical transport to QPC team's working demo script */
export function qpcHttpsPost(
  path: string,
  payload: Record<string, string>,
  timeoutMs = 30_000,
): Promise<{ httpStatus: number; body: QpcCreateResponse }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options: https.RequestOptions = {
      hostname: QPC_HOST,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            httpStatus: res.statusCode ?? 0,
            body: JSON.parse(data) as QpcCreateResponse,
          });
        } catch {
          reject(new Error(`QPC invalid JSON (HTTP ${res.statusCode}): ${data.slice(0, 400)}`));
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("QPC request timed out after 30s"));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function parseQpcBody(httpStatus: number, body: QpcCreateResponse): { ok: true; data: QpcCreateData } | { ok: false; error: string } {
  if (body.cloudflare_error || httpStatus === 502 || String(body.status) === "502") {
    return {
      ok: false,
      error:
        body.detail ??
        body.title ??
        "QPC payment server is temporarily down. Please try again shortly.",
    };
  }
  if (String(body.status) !== "200" || !body.data) {
    return { ok: false, error: body.message ?? `QPC error (HTTP ${httpStatus}, status ${body.status}).` };
  }
  return { ok: true, data: body.data };
}

export async function callQpcPayinCreate(input: {
  merchantId: string;
  merchantOrderNo: string;
  amount: string;
  currency: string;
  signature: string;
  redirectUrl: string;
  notifyUrl: string;
  description?: string;
  payer?: QpcPayerInput;
}): Promise<{ ok: true; data: QpcCreateData } | { ok: false; error: string }> {
  const payer = buildPayerFields(input.payer ?? {});

  const payload: Record<string, string> = {
    merchantId: input.merchantId,
    merchantOrderNo: input.merchantOrderNo,
    amount: input.amount,
    currency: input.currency,
    payerName: payer.payerName,
    payerEmail: payer.payerEmail,
    payerMobile: payer.payerMobile,
    description: input.description?.trim() || "Payment for order " + input.merchantOrderNo,
    redirectUrl: input.redirectUrl,
    notifyUrl: input.notifyUrl,
    signature: input.signature,
  };

  console.log("[QPC] Creating PayIn:", input.merchantOrderNo, "amount:", input.amount);

  try {
    const { httpStatus, body } = await qpcHttpsPost(QPC_PAYIN_CREATE_PATH, payload);
    console.log("[QPC] PayIn HTTP:", httpStatus, "status:", body.status);

    const parsed = parseQpcBody(httpStatus, body);
    if (!parsed.ok) return parsed;

    console.log("[QPC] PayIn OK — paymentPageUrl:", parsed.data.paymentPageUrl);
    return parsed;
  } catch (err) {
    const error = err instanceof Error ? err.message : "QPC request failed";
    console.error("[QPC] PayIn error:", error);
    return { ok: false, error };
  }
}

export async function callQpcPayinStatus(
  merchantOrderNo: string,
): Promise<{ ok: true; data: QpcPayinStatusData } | { ok: false; error: string }> {
  const merchantId = getQpcMerchantId();
  const merchantKey = getQpcMerchantKey();
  const signature = qpcPayinSign(merchantId, merchantOrderNo, "", merchantKey);

  try {
    const { httpStatus, body } = await qpcHttpsPost(QPC_PAYIN_STATUS_PATH, {
      merchantId,
      merchantOrderNo,
      signature,
    });

    if (body.cloudflare_error || httpStatus === 502) {
      return { ok: false, error: body.detail ?? body.title ?? "QPC status unavailable." };
    }
    if (String(body.status) !== "200" || !body.data) {
      return { ok: false, error: body.message ?? "QPC status error." };
    }
    return { ok: true, data: body.data as QpcPayinStatusData };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "QPC status failed" };
  }
}
