"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useState, useEffect } from "react";
import type { SafeUser } from "@/lib/auth";

type AuthMode = "signin" | "register" | "forgot_password";
type RegisterStep = "email" | "code" | "password";


type Props = {
  open: boolean;
  initialMode: AuthMode;
  onClose: () => void;
  onAuthed: (user: SafeUser) => void;
};

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong.");
  }

  return data;
}

function AuthModalBody({
  initialMode,
  onClose,
  onAuthed,
}: {
  initialMode: AuthMode;
  onClose: () => void;
  onAuthed: (user: SafeUser) => void;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<RegisterStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [registrationToken, setRegistrationToken] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setStep("email");
    setEmail("");
    setCode("");
    setDevCode("");
    setRegistrationToken("");
    setName("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setStatus("");
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      if (mode === "signin") {
        const data = await postJson<{ user: SafeUser }>("/api/auth/login", { email, password });
        onAuthed(data.user);
        onClose();
        return;
      }

      if (mode === "forgot_password") {
        if (step === "email") {
          const data = await postJson<{
            message: string;
            devCode?: string;
            expiresInMinutes: number;
          }>("/api/auth/forgot-password/request-code", { email });
          setStatus(data.message);
          setDevCode(data.devCode ?? "");
          setStep("code");
          return;
        }

        if (step === "code") {
          const data = await postJson<{ resetToken: string; message: string }>(
            "/api/auth/forgot-password/verify-code",
            { email, code },
          );
          setRegistrationToken(data.resetToken);
          setStatus(data.message);
          setStep("password");
          return;
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const data = await postJson<{ user: SafeUser }>("/api/auth/forgot-password/complete", {
          email,
          password,
          resetToken: registrationToken,
        });

        setStatus("Password reset successfully. Logging you in...");
        setTimeout(() => {
          onAuthed(data.user);
          onClose();
        }, 1200);
        return;
      }

      if (step === "email") {
        const data = await postJson<{
          message: string;
          devCode?: string;
          expiresInMinutes: number;
        }>("/api/auth/register/request-code", { email });
        setStatus(data.message);
        setDevCode(data.devCode ?? "");
        setStep("code");
        return;
      }

      if (step === "code") {
        const data = await postJson<{ registrationToken: string; message: string }>(
          "/api/auth/register/verify-code",
          { email, code },
        );
        setRegistrationToken(data.registrationToken);
        setStatus(data.message);
        setStep("password");
        return;
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      const data = await postJson<{ user: SafeUser }>("/api/auth/register/complete", {
        email,
        name,
        password,
        registrationToken,
      });
      import("react-facebook-pixel")
        .then((x) => x.default)
        .then((ReactPixel) => {
          ReactPixel.track("CompleteRegistration", {
            status: "success",
            content_name: data.user.name,
          });
        })
        .catch(() => {});
      onAuthed(data.user);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to continue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 24, scale: 0.96 }}
      animate={{ y: 0, scale: 1 }}
      exit={{ y: 16, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="royal-panel relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-background p-5 shadow-2xl shadow-black/40 sm:p-6"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:border-white/25 hover:text-white"
      >
        Close
      </button>

      {mode === "signin" ? (
        <div className="pr-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">
            Welcome back
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">Sign in to Subhlaxmi</h2>
        </div>
      ) : mode === "register" ? (
        <div className="pr-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">
            New account
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">Create your account</h2>
        </div>
      ) : (
        <div className="pr-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/70">
            Reset Password
          </p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">Recover your account</h2>
        </div>
      )}

      {mode === "register" || mode === "forgot_password" ? (
        <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {(["email", "code", "password"] as RegisterStep[]).map((item, index) => {
            const order = ["email", "code", "password"];
            const isActive = step === item;
            const isDone = index < order.indexOf(step);
            return (
              <div
                key={item}
                className={`rounded-full px-3 py-2 text-center ${
                  isActive
                    ? "border border-amber-300/40 bg-amber-300/15 text-amber-100"
                    : isDone
                      ? "border border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                      : "border border-white/8 bg-white/5 text-zinc-500"
                }`}
              >
                {item === "email" ? "Email" : item === "code" ? "OTP" : "Password"}
              </div>
            );
          })}
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-5 space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-zinc-300">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={(mode === "register" || mode === "forgot_password") && step !== "email"}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
            placeholder="you@example.com"
            required
          />
        </label>

        {mode === "signin" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => switchMode("forgot_password")}
                className="text-xs font-semibold text-amber-200 transition hover:text-amber-100"
              >
                Forgot Password?
              </button>
            </div>
          </>
        ) : null}

        {(mode === "register" || mode === "forgot_password") && step === "code" ? (
          <label className="block">
            <span className="text-xs font-semibold text-zinc-300">OTP</span>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm tracking-[0.35em] text-white outline-none transition placeholder:tracking-normal placeholder:text-zinc-600 focus:border-amber-200/50"
              placeholder="______"
              inputMode="numeric"
              minLength={6}
              maxLength={6}
              required
            />
          </label>
        ) : null}

        {mode === "register" && step === "password" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-300">Full Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
                placeholder="Your name"
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-300">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>
          </>
        ) : null}

        {mode === "forgot_password" && step === "password" ? (
          <>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-300">New Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-zinc-300">Confirm New Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-amber-200/50"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </label>
          </>
        ) : null}

        {devCode ? (
          <div className="rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-xs leading-5 text-amber-100">
            Local dev code: <span className="font-bold tracking-[0.2em]">{devCode}</span>
          </div>
        ) : null}

        {status ? (
          <p className="rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-100">
            {status}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full sl-cta-gradient px-5 py-3 text-sm font-bold sl-force-light-text transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "signin"
              ? "Sign In"
              : step === "email"
                ? "Send OTP"
                : step === "code"
                  ? "Verify OTP"
                  : mode === "forgot_password"
                    ? "Reset Password"
                    : "Create Account"}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
        {mode === "signin" ? (
          <>
            <span>New user?</span>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="font-semibold text-amber-200 transition hover:text-amber-100"
            >
              Create account
            </button>
          </>
        ) : mode === "register" ? (
          <>
            <span>Already have an account?</span>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-semibold text-amber-200 transition hover:text-amber-100"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            <span>Back to</span>
            <button
              type="button"
              onClick={() => switchMode("signin")}
              className="font-semibold text-amber-200 transition hover:text-amber-100"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

export function AuthModal({ open, initialMode, onClose, onAuthed }: Props) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).isAuthModalOpen = open;
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <AuthModalBody initialMode={initialMode} onClose={onClose} onAuthed={onAuthed} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
