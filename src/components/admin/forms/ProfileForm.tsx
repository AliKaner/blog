"use client";

import { useState } from "react";

export type ProfileFormValues = {
  name: string;
  title: string;
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  letterboxdUrl: string;
  tiktokUrl: string;
  mediumUrl: string;
};

const EMPTY: ProfileFormValues = {
  name: "",
  title: "",
  bio: "",
  linkedinUrl: "",
  githubUrl: "",
  letterboxdUrl: "",
  tiktokUrl: "",
  mediumUrl: "",
};

export function ProfileForm({
  initial,
  onSubmit,
  submitting,
}: {
  initial?: Partial<ProfileFormValues>;
  onSubmit: (values: {
    name: string;
    title?: string;
    bio?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    letterboxdUrl?: string;
    tiktokUrl?: string;
    mediumUrl?: string;
  }) => Promise<void>;
  submitting: boolean;
}) {
  const [values, setValues] = useState<ProfileFormValues>({
    ...EMPTY,
    ...initial,
  });

  function set<K extends keyof ProfileFormValues>(
    key: K,
    val: ProfileFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name: values.name,
      title: values.title || undefined,
      bio: values.bio || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      githubUrl: values.githubUrl || undefined,
      letterboxdUrl: values.letterboxdUrl || undefined,
      tiktokUrl: values.tiktokUrl || undefined,
      mediumUrl: values.mediumUrl || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Name">
        <input
          required
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Title">
        <input
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Bio">
        <textarea
          rows={4}
          value={values.bio}
          onChange={(e) => set("bio", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="LinkedIn URL">
        <input
          value={values.linkedinUrl}
          onChange={(e) => set("linkedinUrl", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="GitHub URL">
        <input
          value={values.githubUrl}
          onChange={(e) => set("githubUrl", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Letterboxd URL">
        <input
          value={values.letterboxdUrl}
          onChange={(e) => set("letterboxdUrl", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="TikTok URL">
        <input
          value={values.tiktokUrl}
          onChange={(e) => set("tiktokUrl", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Medium URL">
        <input
          value={values.mediumUrl}
          onChange={(e) => set("mediumUrl", e.target.value)}
          className="input"
        />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="btn w-fit px-4 py-2 text-sm disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save"}
      </button>
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
