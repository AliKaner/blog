"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

export function ImageUploader({
  value,
  existingUrl,
  onChange,
  label = "Image",
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-2 h-32 w-32 rounded-sm border border-border object-cover"
        />
      )}
      <input
        type="file"
        accept="image/*"
        className="mt-2 text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {uploading && (
        <p className="mt-1 text-xs text-ink-soft">Uploading…</p>
      )}
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
