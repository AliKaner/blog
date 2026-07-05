"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type MovieFormValues = {
  title: string;
  slug: string;
  year: string;
  rating: string;
  review: string;
  posterStorageId: string | undefined;
  watchedAt: string;
  published: boolean;
};

const EMPTY: MovieFormValues = {
  title: "",
  slug: "",
  year: "",
  rating: "",
  review: "",
  posterStorageId: undefined,
  watchedAt: dateToInputValue(Date.now()),
  published: false,
};

export function MovieForm({
  initial,
  existingPosterUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<MovieFormValues>;
  existingPosterUrl?: string | null;
  onSubmit: (values: {
    title: string;
    slug: string;
    year?: number;
    rating?: number;
    review?: string;
    posterStorageId?: string;
    watchedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<MovieFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof MovieFormValues>(key: K, val: MovieFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: values.title,
      slug: values.slug,
      year: values.year ? Number(values.year) : undefined,
      rating: values.rating ? Number(values.rating) : undefined,
      review: values.review || undefined,
      posterStorageId: values.posterStorageId,
      watchedAt: inputValueToDate(values.watchedAt),
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
      <Field label="Year">
        <input
          type="number"
          value={values.year}
          onChange={(e) => set("year", e.target.value)}
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
      <Field label="Watched on">
        <input
          type="date"
          required
          value={values.watchedAt}
          onChange={(e) => set("watchedAt", e.target.value)}
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
        label="Poster"
        value={values.posterStorageId}
        existingUrl={existingPosterUrl}
        onChange={(id) => set("posterStorageId", id)}
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
          className="rounded-sm bg-accent px-4 py-2 text-sm text-paper disabled:opacity-50"
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
