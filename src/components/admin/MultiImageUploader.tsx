"use client";

import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";

type Item = { storageId: string; previewUrl: string };

export function MultiImageUploader({
  value,
  existingUrls,
  onChange,
  label = "Photos",
}: {
  value: string[];
  existingUrls?: (string | null)[];
  onChange: (storageIds: string[]) => void;
  label?: string;
}) {
  const { token } = useAdminSession();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const [items, setItems] = useState<Item[]>(() =>
    value.map((storageId, i) => ({
      storageId,
      previewUrl: existingUrls?.[i] ?? "",
    })),
  );
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList) {
    if (!token) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const previewUrl = URL.createObjectURL(file);
        const uploadUrl = await generateUploadUrl({ token });
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        setItems((prev) => {
          const next = [...prev, { storageId, previewUrl }];
          onChange(next.map((i) => i.storageId));
          return next;
        });
      }
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      onChange(next.map((i) => i.storageId));
      return next;
    });
  }

  return (
    <div>
      <label className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </label>
      {items.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.map((item, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.previewUrl}
                alt=""
                className="h-24 w-24 rounded-sm border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-xs text-paper"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        className="mt-2 text-sm"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
        }}
      />
      {uploading && <p className="mt-1 text-xs text-ink-soft">Uploading…</p>}
    </div>
  );
}
