"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";

export type DrawingFormValues = {
  title: string;
  imageStorageId: string | undefined;
  order: string;
  published: boolean;
};

const EMPTY: DrawingFormValues = {
  title: "",
  imageStorageId: undefined,
  order: "0",
  published: false,
};

export function DrawingForm({
  initial,
  existingImageUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<DrawingFormValues>;
  existingImageUrl?: string | null;
  onSubmit: (values: {
    title?: string;
    imageStorageId: string;
    order: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<DrawingFormValues>({
    ...EMPTY,
    ...initial,
  });

  function set<K extends keyof DrawingFormValues>(
    key: K,
    val: DrawingFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.imageStorageId) return;
    await onSubmit({
      title: values.title || undefined,
      imageStorageId: values.imageStorageId,
      order: Number(values.order) || 0,
      published: values.published,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Title (optional)">
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className="input"
        />
      </Field>
      <ImageUploader
        label="Drawing"
        value={values.imageStorageId}
        existingUrl={existingImageUrl}
        onChange={(id) => set("imageStorageId", id)}
      />
      <Field label="Sort order (lower shows first)">
        <input
          type="number"
          value={values.order}
          onChange={(e) => set("order", e.target.value)}
          className="input"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.published}
          onChange={(e) => set("published", e.target.checked)}
        />
        Published
      </label>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !values.imageStorageId}
          className="btn px-4 py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
