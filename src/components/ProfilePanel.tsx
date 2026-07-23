"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { SafeUser, TicketBooking, UserSettings } from "@/lib/auth";

type ProfilePayload = {
  user: SafeUser;
  tickets: TicketBooking[];
};

type Props = {
  open: boolean;
  user: SafeUser | null;
  onClose: () => void;
  onUserUpdated: (user: SafeUser | null) => void;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Something went wrong.");
  }

  return data;
}

export function ProfilePanel({ open, user, onClose, onUserUpdated }: Props) {
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const lastLoadedUserIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    if (profile?.user?.id === user.id) return;
    if (lastLoadedUserIdRef.current === user.id) return;

    let cancelled = false;
    lastLoadedUserIdRef.current = user.id;
    setError("");
    Promise.resolve()
      .then(() => fetchJson<ProfilePayload>("/api/profile"))
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Unable to load profile.");
      })

    return () => {
      cancelled = true;
    };
  }, [open, user?.id, profile?.user?.id]);

  const updateSettings = async (settings: Partial<UserSettings>) => {
    if (!profile) return;
    setSaving(true);
    setError("");

    try {
      const data = await fetchJson<ProfilePayload>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ settings }),
      });
      setProfile(data);
      onUserUpdated(data.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setUploadingImage(true);
    setError("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, "");
    const uploadPreset = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "subhlaxmi").replace(/['"]/g, "");

    if (!cloudName) {
      setError("Cloudinary configuration missing. Please add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to your .env file.");
      setUploadingImage(false);
      return;
    }

    try {
      // Upload file directly to Cloudinary using Unsigned Upload Preset
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error?.message || "Failed to upload image to Cloudinary.");
      }

      const data = await res.json();
      const imageUrl = data.secure_url;

      // Save new image URL to database
      const profileData = await fetchJson<ProfilePayload>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ image: imageUrl }),
      });
      
      setProfile(profileData);
      onUserUpdated(profileData.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uploading image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const signOut = async () => {
    setSaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    setSaving(false);
    setProfile(null);
    onUserUpdated(null);
    onClose();
  };

  const activeUser = profile?.user ?? user;
  const loading = open && !!user && !profile && !error;

  return (
    <AnimatePresence>
      {open && activeUser ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sl-profile-overlay fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="sl-profile-panel royal-panel flex h-full w-full max-w-md flex-col border-l border-amber-200/15 bg-[#14070f] p-5 shadow-2xl shadow-black/40 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Profile Picture Upload */}
                <div className="group relative shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-amber-400/30 bg-black/40 transition hover:border-amber-400/60"
                  >
                    {activeUser.image ? (
                      <img src={activeUser.image} alt={activeUser.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-amber-200/50">
                        {activeUser.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>

                    {/* Loading Spinner */}
                    {uploadingImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-t-amber-400 border-white/20" />
                      </div>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-200/80">My Profile</p>
                  <h2 className="mt-1.5 text-xl sm:text-2xl font-semibold text-white">{activeUser.name}</h2>
                  <p className="mt-0.5 text-sm text-zinc-400">{activeUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="sl-profile-close rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-white/25 hover:text-white"
              >
                Close
              </button>
            </div>

            {/* Admin Dashboard shortcut — only for admins */}
            {activeUser.role === "admin" && (
              <a
                href="/admin"
                className="sl-admin-btn mt-5 flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-4 py-3.5 text-left transition hover:border-amber-400/70 hover:from-amber-500/25 hover:to-orange-500/20"
                onClick={onClose}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-[#1a0900] shadow-md">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-amber-200">Admin Dashboard</span>
                  <span className="mt-0.5 block text-xs text-amber-200/60">Manage draws, users & results</span>
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden className="shrink-0 text-amber-400/60">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </a>
            )}

            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pb-5">
              {loading ? <p className="mt-6 text-sm text-zinc-400">Loading profile...</p> : null}
              {error ? (
                <p className="mt-5 rounded-2xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                  {error}
                </p>
              ) : null}

              <ContactDetailsSection
                user={activeUser}
                saving={saving}
                onSave={async (payload) => {
                  setSaving(true);
                  setError("");
                  try {
                    const data = await fetchJson<ProfilePayload>("/api/profile", {
                      method: "PATCH",
                      body: JSON.stringify(payload),
                    });
                    setProfile(data);
                    onUserUpdated(data.user);
                  } catch (caught) {
                    setError(caught instanceof Error ? caught.message : "Unable to save contact details.");
                  } finally {
                    setSaving(false);
                  }
                }}
              />

              <section className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">Ticket Booking History</h3>
                    <p className="mt-1 text-xs text-zinc-500">Recent tickets booked from this account.</p>
                  </div>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-zinc-300">
                    {profile?.tickets.length ?? 0}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {profile?.tickets.length ? (
                    profile.tickets.map((ticket) => (
                      <article
                        key={ticket.id}
                        className="rounded-2xl border border-amber-200/10 bg-[#120b0f] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{ticket.drawName}</p>
                            <p className="mt-1 text-xs text-amber-200">{ticket.prize}</p>
                          </div>
                          <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-100">
                            {ticket.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
                          <span className="rounded-full bg-white/6 px-2.5 py-1">{ticket.ticketNumber}</span>
                          <span className="rounded-full bg-white/6 px-2.5 py-1">{ticket.drawTime}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-zinc-200">No ticket bookings yet</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-500">
                        Book a draw from the home page and it will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <button
              type="button"
              onClick={signOut}
              disabled={saving}
              className="sl-profile-signout mt-4 w-full cursor-pointer rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white/30 disabled:opacity-60"
            >
              Sign Out
            </button>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ContactDetailsSection({
  user,
  saving,
  onSave,
}: {
  user: SafeUser;
  saving: boolean;
  onSave: (payload: { name?: string; phone?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");

  useEffect(() => {
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user.id, user.name, user.phone]);

  const dirty = name.trim() !== user.name || phone.trim() !== (user.phone ?? "");

  return (
    <section className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-4">
      <h3 className="font-semibold text-white">Contact details</h3>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        Used for UPI payments at checkout. Email is from your account sign-in.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Email</span>
          <input
            type="email"
            value={user.email}
            readOnly
            className="mt-1.5 w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-sm text-zinc-500"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-zinc-400">Mobile (10 digits)</span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="9876543210"
            maxLength={14}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-400/40"
          />
        </label>

        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() =>
            onSave({
              name: name.trim(),
              phone: phone.trim() || "",
            })
          }
          className="w-full rounded-full bg-amber-300 px-4 py-2.5 text-sm font-bold text-[#2d1400] transition hover:bg-amber-200 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save contact details"}
        </button>
      </div>
    </section>
  );
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <span>
        <span className="block text-sm font-semibold text-zinc-100">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-zinc-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-amber-300"
      />
    </label>
  );
}

