"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

type ApiResponse = {
  users: User[];
  total: number;
  page: number;
  limit: number;
};

function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  danger,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#1a0d12] p-6 shadow-2xl"
      >
        <p className="text-sm text-zinc-200 leading-relaxed">{message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-white/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
              danger
                ? "bg-red-500/80 hover:bg-red-500"
                : "bg-amber-500/80 hover:bg-amber-500"
            }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ type: "delete" | "role"; user: User } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      const r = await fetch(`/api/admin/users?${params.toString()}`);
      if (!r.ok) throw new Error("Failed to load users.");
      const data = (await r.json()) as ApiResponse;
      setUsers(data.users);
      setTotal(data.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const deleteUser = async (user: User) => {
    setConfirm(null);
    setActionLoading(user.id);
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Delete failed.");
      }
      await fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRole = async (user: User) => {
    setConfirm(null);
    setActionLoading(user.id);
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!r.ok) {
        const d = (await r.json()) as { error?: string };
        throw new Error(d.error ?? "Update failed.");
      }
      await fetchUsers();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setActionLoading(null);
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 gap-2">
          <div className="relative min-w-0 flex-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-2.5 pl-9 pr-4 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/20"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/25"
          >
            Search
          </button>
        </form>
        <span className="text-xs text-zinc-500">{total} users total</span>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/15 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(5)].map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 animate-pulse rounded-md bg-white/8" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/5 transition hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/30 to-orange-500/20 text-xs font-bold text-amber-200">
                            {user.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-zinc-200">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-zinc-400">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            user.role === "admin"
                              ? "border border-amber-400/30 bg-amber-400/10 text-amber-300"
                              : "border border-white/10 bg-white/5 text-zinc-400"
                          }`}
                        >
                          {user.role === "admin" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                          {user.role === "admin" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={actionLoading === user.id}
                            onClick={() => setConfirm({ type: "role", user })}
                            className="rounded-lg border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-amber-400/30 hover:text-amber-200 disabled:opacity-40"
                          >
                            {user.role === "admin" ? "Revoke Admin" : "Make Admin"}
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === user.id}
                            onClick={() => setConfirm({ type: "delete", user })}
                            className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-white/12 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/25 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-xl border border-white/12 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-white/25 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm && (
          <ConfirmModal
            message={
              confirm.type === "delete"
                ? `Are you sure you want to permanently delete "${confirm.user.name}"? This action cannot be undone.`
                : confirm.user.role === "admin"
                ? `Remove admin privileges from "${confirm.user.name}"?`
                : `Grant admin privileges to "${confirm.user.name}"?`
            }
            danger={confirm.type === "delete"}
            onConfirm={() =>
              confirm.type === "delete" ? deleteUser(confirm.user) : toggleRole(confirm.user)
            }
            onCancel={() => setConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
