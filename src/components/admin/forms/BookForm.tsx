"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type BookFormValues = {
  title: string;
  slug: string;
  author: string;
  rating: string;
  review: string;
  coverStorageId: string | undefined;
  finishedAt: string;
  published: boolean;
};

const EMPTY: BookFormValues = {
  title: "",
  slug: "",
  author: "",
  rating: "",
  review: "",
  coverStorageId: undefined,
  finishedAt: dateToInputValue(Date.now()),
  published: false,
};

export function BookForm({
  initial,
  existingCoverUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<BookFormValues>;
  existingCoverUrl?: string | null;
  onSubmit: (values: {
    title: string;
    slug: string;
    author?: string;
    rating?: number;
    review?: string;
    coverStorageId?: string;
    finishedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<BookFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof BookFormValues>(key: K, val: BookFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: values.title,
      slug: values.slug,
      author: values.author || undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      review: values.review || undefined,
      coverStorageId: values.coverStorageId,
      finishedAt: inputValueToDate(values.finishedAt),
      published: values.published,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Title">
        <input
          required
          value={values.title}
          onChange={(e) => {
            set("title", e.target.value);
            if (!slugTouched) set("slug", slugify(e.target.value));
          }}
          className="input"
        />
      </Field>
      <Field label="Slug">
        <input
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          className="input"
        />
      </Field>
      <Field label="Author">
        <input
          value={values.author}
          onChange={(e) => set("author", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Rating (1-10)">
        <input
          type="number"
          min={1}
          max={10}
          value={values.rating}
          onChange={(e) => set("rating", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Finished on">
        <input
          type="date"
          required
          value={values.finishedAt}
          onChange={(e) => set("finishedAt", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Review">
        <textarea
          rows={8}
          value={values.review}
          onChange={(e) => set("review", e.target.value)}
          className="input font-mono text-sm"
        />
      </Field>
      <ImageUploader
        label="Cover"
        value={values.coverStorageId}
        existingUrl={existingCoverUrl}
        onChange={(id) => set("coverStorageId", id)}
      />
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
          disabled={submitting}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
