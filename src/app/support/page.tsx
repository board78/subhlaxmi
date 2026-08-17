"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import type { SafeUser } from "@/lib/auth";
import { BadgeCheck, ChevronDown, Clock3, Mail, MessageCircleQuestion, Send, ShieldCheck, Sparkles } from "lucide-react";

export default function SupportPage() {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch profile
  useEffect(() => {
    fetch("/api/profile")
      .then(async (r) => (r.ok ? (await r.json() as { user: SafeUser }) : null))
      .then((d) => {
        if (d?.user) {
          setUser(d.user);
          setName(d.user.name);
          setEmail(d.user.email);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all the fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message ?? "Unable to submit your request.");
      }

      setIsSubmitting(false);
      import("react-facebook-pixel")
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.track("Contact", {
            content_name: subject,
          });
        })
        .catch(() => {});
      toast.success("Support ticket submitted!", {
        description: "Our customer success team will get back to you shortly.",
      });
      setSubject("");
      setMessage("");
    } catch (error) {
      setIsSubmitting(false);
      toast.error(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  };

  const faqs = [
    {
      q: "How do I buy a lottery ticket?",
      a: "Go to the homepage, choose any of the active draws under 'Popular Draws Today', select your desired ticket numbers, add them to your cart, and complete the checkout using UPI or net banking.",
    },
    {
      q: "When are the draw results declared?",
      a: "Each draw has its scheduled draw time mentioned on the ticket card. Once the countdown ends, the winning ticket is processed and declared live on the 'Live Result Board'.",
    },
    {
      q: "How will I get my prize money if I win?",
      a: "Winnings are credited directly to your registered wallet balance or paid out directly via UPI/bank transfer. You can manage your payout details in the profile panel.",
    },
    {
      q: "Is it safe to make payments with UPI?",
      a: "Yes, all transactions are processed through highly secure payment gateways with support for UPI apps like PhonePe, Google Pay, Paytm, and BHIM, ensuring instant confirmation.",
    },
  ];

  return (
    <div className="support-page royal-surface royal-grid relative h-[100dvh] overflow-x-hidden overflow-y-auto bg-background text-foreground">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-fuchsia-500/16 blur-3xl" />
        <div className="absolute right-[-10rem] top-[8rem] h-96 w-96 rounded-full bg-orange-500/16 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[20%] h-[26rem] w-[26rem] rounded-full bg-amber-300/12 blur-3xl" />
      </div>

      <Navbar
        user={user}
        onAuthChange={(newUser) => {
          setUser(newUser);
          if (!newUser) router.push("/");
        }}
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
        <section className="royal-panel relative mb-7 overflow-hidden rounded-[28px] border border-amber-300/20 bg-gradient-to-br from-[#250b18]/95 via-[#17060f]/95 to-[#32120d]/95 px-5 py-7 shadow-2xl shadow-black/20 sm:mb-9 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200">
                <Sparkles size={14} /> Help centre
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">How can we help you today?</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">Get quick answers, find payment guidance, or send our support team a message. We are here to make your experience smooth and secure.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><BadgeCheck size={20} /></div>
              <div><p className="text-xs font-semibold text-white">Always here to help</p><p className="mt-0.5 text-[11px] text-zinc-400">Response within 24 hours</p></div>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Columns: FAQ and Contact Options */}
          <div className="space-y-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <a href="mailto:subhlaxmilottery@gmail.com" className="royal-panel group flex items-start gap-4 rounded-[22px] border border-white/10 bg-[#14070f]/85 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-amber-400/35 hover:bg-[#1c0912]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 transition group-hover:bg-amber-400/20"><Mail size={20} /></div>
                <div><p className="text-sm font-semibold text-white">Email support</p><p className="mt-1 text-xs leading-5 text-zinc-400">For account, payment and booking queries.</p><p className="mt-2 text-sm font-semibold text-amber-300">subhlaxmilottery@gmail.com</p></div>
              </a>
              <div className="royal-panel flex items-start gap-4 rounded-[22px] border border-white/10 bg-[#14070f]/85 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-400/10 text-fuchsia-200"><Clock3 size={20} /></div>
                <div><p className="text-sm font-semibold text-white">Quick response</p><p className="mt-1 text-xs leading-5 text-zinc-400">Our customer support team reviews every request carefully.</p><p className="mt-2 text-sm font-semibold text-amber-300">Usually within 24 hours</p></div>
              </div>
            </div>

            {/* FAQs */}
            <section className="space-y-4">
              <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><MessageCircleQuestion size={18} /></div><div><h2 className="text-xl font-bold tracking-tight text-white">Frequently asked questions</h2><p className="text-xs text-zinc-500">Quick answers to common questions</p></div></div>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="royal-panel group rounded-2xl border border-white/10 bg-[#14070f]/55 p-4 transition-all duration-200 open:border-amber-500/30 open:bg-[#1b0911]"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-medium text-zinc-200 outline-none hover:text-white select-none">
                      <span>{faq.q}</span>
                      <span className="ml-2 text-amber-300 transition-transform duration-200 group-open:rotate-180"><ChevronDown size={18} /></span>
                    </summary>
                    <div className="mt-3 text-sm leading-relaxed text-zinc-400 border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Ticket Submission Form */}
          <aside>
            <div className="royal-panel sticky top-24 overflow-hidden rounded-[26px] border border-amber-300/20 bg-[#17070f]/95 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300"><ShieldCheck size={20} /></div><div><h2 className="text-lg font-semibold text-white">Submit a support ticket</h2><p className="mt-1 text-xs leading-5 text-zinc-400">Share the details and our team will get back to you within 24 hours.</p></div></div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="support-name" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Your Name</label>
                  <input
                    id="support-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400/50 focus:bg-white/[0.08]"
                  />
                </div>

                <div>
                  <label htmlFor="support-email" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Email Address</label>
                  <input
                    id="support-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400/50 focus:bg-white/[0.08]"
                  />
                </div>

                <div>
                  <label htmlFor="support-subject" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Subject</label>
                  <input
                    id="support-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Ticket Booking Issue"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400/50 focus:bg-white/[0.08]"
                  />
                </div>

                <div>
                  <label htmlFor="support-message" className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Message</label>
                  <textarea
                    id="support-message"
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Explain your problem in detail..."
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-amber-400/50 focus:bg-white/[0.08] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-full sl-cta-gradient py-3 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Send size={16} /> {isSubmitting ? "Submitting..." : "Send message"}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
