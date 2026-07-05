"use client";

import { useState } from "react";
import { dateToInputValue, inputValueToDate, slugify } from "@/lib/format";

export type SoftwareLogFormValues = {
  title: string;
  slug: string;
  body: string;
  tags: string;
  loggedAt: string;
  published: boolean;
};

const EMPTY: SoftwareLogFormValues = {
  title: "",
  slug: "",
  body: "",
  tags: "",
  loggedAt: dateToInputValue(Date.now()),
  published: false,
};

export function SoftwareLogForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<SoftwareLogFormValues>;
  onSubmit: (values: {
    title: string;
    slug: string;
    body: string;
    tags?: string[];
    loggedAt: number;
    published: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<SoftwareLogFormValues>({
    ...EMPTY,
    ...initial,
  });
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);

  function set<K extends keyof SoftwareLogFormValues>(
    key: K,
    val: SoftwareLogFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      title: values.title,
      slug: values.slug,
      body: values.body,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : undefined,
      loggedAt: inputValueToDate(values.loggedAt),
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
          value={values.loggedAt}
          onChange={(e) => set("loggedAt", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Tags (comma separated)">
        <input
          value={values.tags}
          onChange={(e) => set("tags", e.target.value)}
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
