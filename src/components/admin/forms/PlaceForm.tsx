"use client";

import { useState } from "react";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type PlaceFormValues = {
  name: string;
  slug: string;
  country: string;
  description: string;
  photoStorageIds: string[];
  visitedAt: string;
  published: boolean;
};

const EMPTY: PlaceFormValues = {
  name: "",
  slug: "",
  country: "",
  description: "",
  photoStorageIds: [],
  visitedAt: dateToInputValue(Date.now()),
  published: false,
};

export function PlaceForm({
  initial,
  existingPhotoUrls,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<PlaceFormValues>;
  existingPhotoUrls?: (string | null)[];
  onSubmit: (values: {
    name: string;
    slug: string;
    country?: string;
    description?: string;
    photoStorageIds: string[];
    visitedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<PlaceFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof PlaceFormValues>(key: K, val: PlaceFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name: values.name,
      slug: values.slug,
      country: values.country || undefined,
      description: values.description || undefined,
      photoStorageIds: values.photoStorageIds,
      visitedAt: inputValueToDate(values.visitedAt),
      published: values.published,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Name">
        <input
          required
          value={values.name}
          onChange={(e) => {
            set("name", e.target.value);
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
      <Field label="Country">
        <input
          value={values.country}
          onChange={(e) => set("country", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Visited on">
        <input
          type="date"
          required
          value={values.visitedAt}
          onChange={(e) => set("visitedAt", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Description">
        <textarea
          rows={6}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="input font-mono text-sm"
        />
      </Field>
      <MultiImageUploader
        value={values.photoStorageIds}
        existingUrls={existingPhotoUrls}
        onChange={(ids) => set("photoStorageIds", ids)}
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
