"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

export function VideoUploader({
  value,
  existingUrl,
  onChange,
  label = "Video file",
}: {
  value: string | undefined;
  existingUrl?: string | null;
  onChange: (storageId: string | undefined) => void;
  label?: string;
}) {
  const { token } = useAdminSession();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!token) return;
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    try {
      const uploadUrl = await generateUploadUrl({ token });
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      onChange(storageId);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      {preview && (
        <video
          src={preview}
          controls
          muted
          className="mt-2 h-32 w-full max-w-xs border border-border object-cover"
        />
      )}
      <input
        type="file"
        accept="video/*"
        className="mt-2 text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading…</p>}
      {value && !uploading && (
        <button
          type="button"
          onClick={() => {
            setPreview(null);
            onChange(undefined);
          }}
          className="mt-1 block text-xs text-accent"
        >
          Remove
        </button>
      )}
    </div>
  );
}
