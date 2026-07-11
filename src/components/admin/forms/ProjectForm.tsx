"use client";

import { useState } from "react";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";
import { slugify } from "@/lib/format";

export type ProjectFormValues = {
  title: string;
  slug: string;
  description: string;
  imageStorageIds: string[];
  url: string;
  githubUrl: string;
  npmUrl: string;
  order: string;
  published: boolean;
};

const EMPTY: ProjectFormValues = {
  title: "",
  slug: "",
  description: "",
  imageStorageIds: [],
  url: "",
  githubUrl: "",
  npmUrl: "",
  order: "0",
  published: false,
};

export function ProjectForm({
  initial,
  existingImageUrls,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<ProjectFormValues>;
  existingImageUrls?: (string | null)[];
  onSubmit: (values: {
    title: string;
    slug: string;
    description?: string;
    imageStorageIds: string[];
    url?: string;
    githubUrl?: string;
    npmUrl?: string;
    order: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<ProjectFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof ProjectFormValues>(
    key: K,
    val: ProjectFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: values.title,
      slug: values.slug,
      description: values.description || undefined,
      imageStorageIds: values.imageStorageIds,
      url: values.url || undefined,
      githubUrl: values.githubUrl || undefined,
      npmUrl: values.npmUrl || undefined,
      order: Number(values.order) || 0,
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
      <Field label="Description">
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Website (optional)">
        <input
          type="url"
          value={values.url}
          onChange={(e) => set("url", e.target.value)}
          className="input"
          placeholder="https://example.com"
        />
      </Field>
      <Field label="GitHub (optional)">
        <input
          type="url"
          value={values.githubUrl}
          onChange={(e) => set("githubUrl", e.target.value)}
          className="input"
          placeholder="https://github.com/user/repo"
        />
      </Field>
      <Field label="npm (optional)">
        <input
          type="url"
          value={values.npmUrl}
          onChange={(e) => set("npmUrl", e.target.value)}
          className="input"
          placeholder="https://www.npmjs.com/package/name"
        />
      </Field>
      <MultiImageUploader
        label="Images"
        value={values.imageStorageIds}
        existingUrls={existingImageUrls}
        onChange={(ids) => set("imageStorageIds", ids)}
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
