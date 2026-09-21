"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FaShareAlt, FaCopy } from "react-icons/fa";

export function ReferralModal({ drawId, drawName, onClose }: { drawId: string; drawName: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const ticketLink = typeof window !== "undefined" ? `${window.location.origin}/book/${drawId}` : "";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/referral/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toEmail: email, drawName, ticketLink }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to send");
      toast.success("Referral sent successfully!");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending email");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const { user } = await res.json();
      if (!user?.referralCode) throw new Error("Could not load referral code");
      const refLink = `${ticketLink}?ref=${user.referralCode}`;
      await navigator.clipboard.writeText(refLink);
      toast.success("Referral link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#170610] p-6 shadow-2xl"
      >
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <FaShareAlt className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-white">Refer a Friend</h2>
          <p className="mt-1.5 text-sm text-zinc-400">
            Send this ticket to a friend. When they buy using your link, you get <span className="font-bold text-amber-300">10% OFF</span> your next purchase!
          </p>
        </div>

        <form onSubmit={handleSend} className="mb-6 space-y-4">
          {error && <p className="rounded border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-400">{error}</p>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Friend&apos;s Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400/50 focus:bg-white/10 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white transition hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#170610] px-2 text-zinc-500 uppercase font-semibold tracking-widest">or</span>
          </div>
        </div>

        <button
          onClick={copyLink}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
        >
          <FaCopy />
          Copy Referral Link
        </button>

        <button
          onClick={onClose}
          className="mt-4 block w-full text-center text-xs font-semibold text-zinc-500 transition hover:text-zinc-300"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
