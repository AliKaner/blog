"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { VideoUploader } from "@/components/admin/VideoUploader";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type TutorialArticleFormValues = {
  title: string;
  slug: string;
  body: string;
  videoUrl: string;
  videoStorageId: string | undefined;
  coverStorageId: string | undefined;
  order: string;
  publishedAt: string;
  published: boolean;
};

const EMPTY: TutorialArticleFormValues = {
  title: "",
  slug: "",
  body: "",
  videoUrl: "",
  videoStorageId: undefined,
  coverStorageId: undefined,
  order: "0",
  publishedAt: dateToInputValue(Date.now()),
  published: false,
};

export function TutorialArticleForm({
  initial,
  existingCoverUrl,
  existingVideoFileUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<TutorialArticleFormValues>;
  existingCoverUrl?: string | null;
  existingVideoFileUrl?: string | null;
  onSubmit: (values: {
    title: string;
    slug: string;
    body?: string;
    videoUrl?: string;
    videoStorageId?: string;
    coverStorageId?: string;
    order: number;
    publishedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<TutorialArticleFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof TutorialArticleFormValues>(
    key: K,
    val: TutorialArticleFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: values.title,
      slug: values.slug,
      body: values.body || undefined,
      videoUrl: values.videoUrl || undefined,
      videoStorageId: values.videoStorageId,
      coverStorageId: values.coverStorageId,
      order: Number(values.order) || 0,
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
      <Field label="Video link (YouTube, Vimeo, or any URL)">
        <input
          type="url"
          value={values.videoUrl}
          onChange={(e) => set("videoUrl", e.target.value)}
          className="input"
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </Field>
      <VideoUploader
        label="…or upload a video file"
        value={values.videoStorageId}
        existingUrl={existingVideoFileUrl}
        onChange={(id) => set("videoStorageId", id)}
      />
      <ImageUploader
        label="Cover image (optional)"
        value={values.coverStorageId}
        existingUrl={existingCoverUrl}
        onChange={(id) => set("coverStorageId", id)}
      />
      <Field label="Body (markdown, optional)">
        <textarea
          rows={10}
          value={values.body}
          onChange={(e) => set("body", e.target.value)}
          className="input font-mono text-sm"
        />
      </Field>
      <Field label="Published on">
        <input
          type="date"
          required
          value={values.publishedAt}
          onChange={(e) => set("publishedAt", e.target.value)}
          className="input"
        />
      </Field>
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
