"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type ImageResult = {
  id: string;
  imageUrl: string;
  resultDate: string;
  resultTime: string;
  createdAt: string;
};

export function ImageResultsManagement() {
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageResult | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/image-results");
      if (!res.ok) throw new Error("Failed to fetch image results");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching results");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/image-results/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete image result");
      setResults((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting image result");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select an image file.");
      return;
    }
    if (!selectedDate || !selectedTime) {
      setError("Please select date and time.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit.");
      return;
    }

    setUploading(true);
    setError("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.replace(/['"]/g, "");
    const uploadPreset = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "subhlaxmi").replace(/['"]/g, "");

    if (!cloudName) {
      setError("Cloudinary configuration missing.");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload image to Cloudinary");
      const data = await res.json();
      const imageUrl = data.secure_url;

      const dbRes = await fetch("/api/admin/image-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, resultDate: selectedDate, resultTime: selectedTime }),
      });

      if (!dbRes.ok) {
        throw new Error("Failed to save to database");
      }
      
      await fetchResults();
      setIsModalOpen(false);
      setSelectedFile(null);
      setSelectedDate("");
      setSelectedTime("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uploading result");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const inp =
    "w-full rounded-lg border border-white/10 bg-[#0f0810]/80 px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 outline-none transition focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20";
  const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500";

  if (loading) {
    return <div className="p-4 text-zinc-400">Loading image results...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Image Results Management</h2>
          <p className="mt-1 text-sm text-zinc-400">Upload and manage visual draw results with dates and times.</p>
        </div>
        
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload Result Image
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 border border-red-500/20">
          {error}
        </div>
      )}

      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center bg-white/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-500 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-zinc-300 font-medium">No image results uploaded yet</p>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">Use the button above to upload result charts or scanned sheets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-background">
              <div className="relative aspect-[3/4] w-full bg-black/40">
                <Image
                  src={img.imageUrl}
                  alt="Result Image"
                  fill
                  className="object-contain transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-sm font-semibold text-white">{img.resultDate}</div>
                    <div className="text-xs text-amber-400">{img.resultTime}</div>
                  </div>
                </div>
              </div>

              <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(img)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white shadow-lg backdrop-blur-sm transition hover:bg-red-600"
                  title="Delete image result"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#170d14] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-6 py-4">
                <h2 className="text-sm font-bold text-white">Upload Result Image</h2>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-zinc-500 transition hover:border-white/20 hover:text-zinc-300">
                  ✕
                </button>
              </div>
              <form onSubmit={handleUploadSubmit} className="space-y-4 px-6 py-5">
                <div>
                  <label className={lbl}>Result Date <span className="text-amber-400">*</span></label>
                  <input type="date" required value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>Result Time <span className="text-amber-400">*</span></label>
                  <input type="time" required value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className={inp} />
                </div>
                <div>
                  <label className={lbl}>Image File <span className="text-amber-400">*</span></label>
                  <input type="file" accept="image/*" required ref={fileInputRef} onChange={handleFileChange}
                    className="w-full text-[13px] text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/20" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={uploading}
                    className="flex-1 rounded-lg border border-white/12 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-white/22 hover:text-zinc-200 disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={uploading || !selectedFile || !selectedDate || !selectedTime}
                    className="flex-1 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-white transition hover:bg-amber-400 disabled:opacity-60 flex items-center justify-center gap-2">
                    {uploading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                    {uploading ? "Uploading..." : "Upload Result"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm overflow-hidden rounded-2xl border border-red-500/30 bg-[#14070f] p-6 shadow-2xl shadow-red-900/20">
              <h3 className="text-lg font-bold text-white text-center">Delete Image Result?</h3>
              <p className="mt-2 text-sm text-zinc-400 text-center">
                Are you sure you want to delete this image result? This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10">
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
