"use client";

import { useState } from "react";

type TestResult = Record<string, unknown>;

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-black/60 p-4 text-xs leading-relaxed text-emerald-300 whitespace-pre-wrap break-all">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function StatusBadge({ status }: { status?: number | string }) {
  const s = Number(status);
  const color =
    s === 200 ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
    s >= 400  ? "bg-red-500/20 text-red-300 border-red-500/30" :
    s >= 300  ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
               "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";
  return (
    <span className={`rounded-full border px-3 py-0.5 text-xs font-bold ${color}`}>
      HTTP {status ?? "—"}
    </span>
  );
}

export default function QpcTestPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [statusOrderId, setStatusOrderId] = useState("");
  const [lastOrderId, setLastOrderId] = useState("");

  async function runTest(action: string, extra?: object) {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch("/api/admin/qpc-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await res.json()) as TestResult;
      setResult(data);
      if (action === "create" && typeof data.merchantOrderNo === "string") {
        setLastOrderId(data.merchantOrderNo);
        setStatusOrderId(data.merchantOrderNo);
      }
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "Request failed" });
    } finally {
      setLoading(null);
    }
  }

  const httpStatus =
    result?.response && typeof result.response === "object"
      ? (result.response as Record<string, unknown>).httpStatus
      : undefined;

  const isSuccess =
    result?.response &&
    typeof result.response === "object" &&
    (result.response as Record<string, unknown>).httpStatus === 200;

  const hasNetworkError =
    result?.response &&
    typeof result.response === "object" &&
    !!(result.response as Record<string, unknown>).networkError;

  return (
    <div className="min-h-screen bg-[#090114] p-6 text-white">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <a href="/admin" className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:border-white/25 hover:text-white transition">
            ← Back to Admin
          </a>
          <div>
            <h1 className="text-2xl font-bold text-white">QPC Gateway Tester</h1>
            <p className="mt-0.5 text-sm text-zinc-500">Test connectivity to <code className="text-amber-300">portalquickpaycash.com</code> using your live credentials</p>
          </div>
        </div>

        {/* Credentials info */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Loaded Credentials</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-black/30 px-4 py-3">
              <p className="text-xs text-zinc-500">Merchant ID</p>
              <p className="mt-1 font-mono text-sm text-amber-300">QPC-MERCH-878462</p>
            </div>
            <div className="rounded-xl bg-black/30 px-4 py-3">
              <p className="text-xs text-zinc-500">Secret Key</p>
              <p className="mt-1 font-mono text-sm text-zinc-400">sk_live_••••••••••••••••</p>
            </div>
            <div className="rounded-xl bg-black/30 px-4 py-3 sm:col-span-2">
              <p className="text-xs text-zinc-500">Callback URL (give this to QPC)</p>
              <p className="mt-1 font-mono text-sm text-emerald-300 break-all">https://bookmysubhlaxmi.com/api/payments/qpc/callback</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {/* Create PayIn */}
          <button
            type="button"
            disabled={!!loading}
            onClick={() => runTest("create")}
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-left hover:border-amber-400/60 hover:bg-amber-500/15 transition disabled:opacity-50"
          >
            <div className="flex items-center gap-2 mb-2">
              {loading === "create" ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20 text-amber-300 text-lg">↓</span>
              )}
              <span className="font-bold text-amber-200">Create PayIn</span>
            </div>
            <p className="text-xs text-zinc-400">POST /api/payin/create with ₹1.00 test amount. Confirms API is reachable.</p>
          </button>

          {/* Balance Check */}
          <button
            type="button"
            disabled={!!loading}
            onClick={() => runTest("balance")}
            className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-left hover:border-blue-400/60 hover:bg-blue-500/15 transition disabled:opacity-50"
          >
            <div className="flex items-center gap-2 mb-2">
              {loading === "balance" ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-400/20 text-blue-300 text-lg">₹</span>
              )}
              <span className="font-bold text-blue-200">Balance Check</span>
            </div>
            <p className="text-xs text-zinc-400">POST /api/balance. Check merchant wallet balance. Confirms credentials.</p>
          </button>

          {/* Status Check */}
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-400/20 text-violet-300 text-lg">⟳</span>
              <span className="font-bold text-violet-200">Check Status</span>
            </div>
            <input
              type="text"
              value={statusOrderId}
              onChange={(e) => setStatusOrderId(e.target.value)}
              placeholder="Order ID"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-violet-400/40 placeholder:text-zinc-600"
            />
            <button
              type="button"
              disabled={!!loading || !statusOrderId.trim()}
              onClick={() => runTest("status", { orderId: statusOrderId.trim() })}
              className="mt-2 w-full rounded-xl bg-violet-500/20 border border-violet-500/30 py-2 text-xs font-bold text-violet-200 hover:bg-violet-500/30 transition disabled:opacity-50"
            >
              {loading === "status" ? "Checking…" : "Check"}
            </button>
          </div>
        </div>

        {/* Last test order hint */}
        {lastOrderId && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs text-emerald-300">
            Last created order: <code className="font-mono font-bold">{lastOrderId}</code> — auto-filled in status checker
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold text-white">Response</p>
              {httpStatus !== undefined && <StatusBadge status={httpStatus as number} />}
              {isSuccess && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-300">
                  ✓ QPC reachable
                </span>
              )}
              {hasNetworkError && (
                <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-0.5 text-xs font-bold text-red-300">
                  ✗ Network / connection error
                </span>
              )}
              {httpStatus === 502 && (
                <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-0.5 text-xs font-bold text-red-300">
                  QPC server down (502)
                </span>
              )}
            </div>

            {/* Interpretation */}
            {result.response && typeof result.response === "object" && (
              <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-xs text-zinc-300 space-y-1">
                {(() => {
                  const r = result.response as Record<string, unknown>;
                  if (r.networkError) return <p>❌ <strong>Network error:</strong> {String(r.networkError)} — QPC server is not reachable. Ask QPC to whitelist your server IP.</p>;
                  if (r.httpStatus === 502) return <p>❌ <strong>502 Bad Gateway</strong> — Cloudflare reached QPC&apos;s server but got a bad response. QPC&apos;s backend is down. Share this with QPC support.</p>;
                  if (r.httpStatus === 404) {
                    const b = r.body as Record<string, unknown>;
                    const msg = String(b?.message ?? "");
                    if (msg.includes("not found")) return <p>⚠️ <strong>404 — Route not found on QPC.</strong> This endpoint may not be enabled for your merchant account. Try <strong>Create PayIn</strong> instead — that&apos;s the real test.</p>;
                    return <p>⚠️ <strong>404</strong> — QPC returned route not found. Contact QPC support to enable this endpoint.</p>;
                  }
                  if (r.httpStatus === 403) return <p>❌ <strong>403 Forbidden</strong> — IP not whitelisted. Provide your server&apos;s outbound IP to QPC support.</p>;
                  if (r.httpStatus === 401) return <p>❌ <strong>401 Unauthorized</strong> — Wrong merchant ID or secret key. Check your .env credentials.</p>;
                  if (r.httpStatus === 200) {
                    const body = r.body as Record<string, unknown>;
                    if (body?.status === "200" || body?.status === 200) {
                      const data = body.data as Record<string, unknown> | undefined;
                      const payUrl = data?.paymentLink ?? data?.paymentPageUrl ?? data?.paymentUrl;
                      return <p>✅ <strong>QPC API is reachable and working!</strong>{payUrl ? ` Payment URL returned: ${String(payUrl)}` : ""}</p>;
                    }
                    return <p>⚠️ HTTP 200 but QPC returned status {String(body?.status)} — {String(body?.message ?? "check raw response below")}</p>;
                  }
                  return null;
                })()}
              </div>
            )}

            <JsonBlock data={result} />
          </div>
        )}

      </div>
    </div>
  );
}
