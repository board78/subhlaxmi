"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type CarouselImage = {
  id: string;
  url: string;
  order: number;
};

export function CarouselManagement() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/carousel-images");
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching images");
    } finally {
      setLoading(false);
    }
  };

  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!imageToDelete) return;
    try {
      const res = await fetch(`/api/carousel-images/${imageToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete image");
      setImages((prev) => prev.filter((img) => img.id !== imageToDelete));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting image");
    } finally {
      setImageToDelete(null);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError((prev) => prev ? `${prev}\nOne or more files exceeded 10MB limit.` : "One or more files exceeded 10MB limit.");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 1, total: validFiles.length });
    setError("");

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "subhlaxmi_preset";

    if (!cloudName) {
      setError("Cloudinary configuration missing. Check environment variables.");
      setUploading(false);
      setUploadProgress(null);
      return;
    }

    try {
      let currentOrder = images.length;
      const uploadedImages: CarouselImage[] = [];

      for (let i = 0; i < validFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: validFiles.length });
        const file = validFiles[i];

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
        const data = await res.json();
        const imageUrl = data.secure_url;

        // Save to database
        const dbRes = await fetch("/api/carousel-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: imageUrl, order: currentOrder }),
        });

        if (!dbRes.ok) throw new Error(`Failed to save ${file.name} to database`);
        const newImgData = await dbRes.json();
        uploadedImages.push(newImgData.image);
        currentOrder++;
      }

      setImages((prev) => [...prev, ...uploadedImages]);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uploading image(s)");
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return <div className="p-4 text-zinc-400">Loading carousel images...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Homepage Carousel</h2>
          <p className="mt-1 text-sm text-zinc-400">Manage the dynamic slider images displayed on the main page.</p>
        </div>
        
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-t-amber-400 border-amber-400/20" />
                {uploadProgress ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` : "Uploading..."}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Image
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-200 border border-red-500/20">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center bg-white/[0.02]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-500 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-zinc-300 font-medium">No custom images uploaded yet</p>
          <p className="mt-1 text-sm text-zinc-500 max-w-sm">The homepage is currently using the default static images. Upload custom images to replace them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#12040c]">
              <div className="relative aspect-video w-full bg-black/40">
                <Image
                  src={img.url}
                  alt="Carousel image"
                  fill
                  className="object-cover transition duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setImageToDelete(img.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white shadow-lg backdrop-blur-sm transition hover:bg-red-600"
                  title="Delete image"
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

      {/* Delete Confirmation Modal */}
      {imageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-red-500/30 bg-[#14070f] p-6 shadow-2xl shadow-red-900/20">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Delete Image?</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Are you sure you want to delete this carousel image? This action cannot be undone.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
