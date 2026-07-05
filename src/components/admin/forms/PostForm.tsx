"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type PostFormValues = {
  title: string;
  slug: string;
  body: string;
  coverStorageId: string | undefined;
  publishedAt: string;
  published: boolean;
};

const EMPTY: PostFormValues = {
  title: "",
  slug: "",
  body: "",
  coverStorageId: undefined,
  publishedAt: dateToInputValue(Date.now()),
  published: false,
};

export function PostForm({
  initial,
  existingCoverUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<PostFormValues>;
  existingCoverUrl?: string | null;
  onSubmit: (values: {
    title: string;
    slug: string;
    body: string;
    coverStorageId?: string;
    publishedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<PostFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof PostFormValues>(key: K, val: PostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: values.title,
      slug: values.slug,
      body: values.body,
      coverStorageId: values.coverStorageId,
      publishedAt: inputValueToDate(values.publishedAt),
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
      <Field label="Date">
        <input
          type="date"
          required
          value={values.publishedAt}
          onChange={(e) => set("publishedAt", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Body (markdown)">
        <textarea
          required
          rows={12}
          value={values.body}
          onChange={(e) => set("body", e.target.value)}
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
