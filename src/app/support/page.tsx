"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import type { SafeUser } from "@/lib/auth";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error("Please fill in all the fields.");
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
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
    }, 1200);
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
    <div className="royal-surface royal-grid relative min-h-screen overflow-x-hidden bg-background text-foreground">
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

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-10 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/70">Help center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Support & Assistance</h1>
          <p className="mt-1 text-sm text-zinc-400">Have questions or need help with a transaction? We are here for you.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Columns: FAQ and Contact Options */}
          <div className="space-y-8 lg:col-span-2">
            {/* Quick Contact Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* <div className="royal-panel flex items-start gap-4 rounded-3xl border border-white/10 bg-[#14070f]/90 p-5 backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Call Helpline</h3>
                  <p className="mt-1 text-xs text-zinc-400">Monday - Saturday (9 AM - 6 PM)</p>
                  <p className="mt-2 text-sm font-semibold text-amber-300">+91 98765 43210</p>
                </div>
              </div> */}

              <div className="royal-panel flex items-start gap-4 rounded-3xl border border-white/10 bg-[#14070f]/90 p-5 backdrop-blur-xl">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Email Support</h3>
                  <p className="mt-1 text-xs text-zinc-400">Available 24x7 for complex queries</p>
                  <p className="mt-2 text-sm font-semibold text-amber-300">subhlaxmilottery@gmail.com</p>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-white">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="royal-panel group rounded-2xl border border-white/10 bg-[#14070f]/50 p-4 transition-colors duration-200 open:bg-[#14070f]/90 open:border-amber-500/20"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-medium text-zinc-200 outline-none hover:text-white select-none">
                      <span>{faq.q}</span>
                      <span className="ml-2 text-zinc-500 transition-transform duration-200 group-open:rotate-180">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
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
            <div className="royal-panel rounded-3xl border border-white/10 bg-[#14070f]/90 p-6 backdrop-blur-xl sticky top-24">
              <h2 className="text-lg font-semibold text-white">Submit a Ticket</h2>
              <p className="mt-1 text-xs text-zinc-400">Drop us a line and we will get back to you within 24 hours.</p>

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
                  className="w-full rounded-full sl-cta-gradient py-3 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Send Message"}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
