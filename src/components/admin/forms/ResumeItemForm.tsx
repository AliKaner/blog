"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { dateToInputValue, inputValueToDate } from "@/lib/format";

type SubProjectFormValue = {
  name: string;
  url: string;
  imageStorageId: string | undefined;
  existingImageUrl?: string | null;
};

export type ResumeItemFormValues = {
  kind: "experience" | "education";
  title: string;
  organization: string;
  startDate: string;
  endDate: string;
  ongoing: boolean;
  description: string;
  order: string;
  published: boolean;
  url: string;
  logoStorageId: string | undefined;
  stack: string;
  projects: SubProjectFormValue[];
};

const EMPTY: ResumeItemFormValues = {
  kind: "experience",
  title: "",
  organization: "",
  startDate: dateToInputValue(Date.now()),
  endDate: "",
  ongoing: true,
  description: "",
  order: "0",
  published: true,
  url: "",
  logoStorageId: undefined,
  stack: "",
  projects: [],
};

export function ResumeItemForm({
  initial,
  existingLogoUrl,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Partial<ResumeItemFormValues>;
  existingLogoUrl?: string | null;
  onSubmit: (values: {
    kind: "experience" | "education";
    title: string;
    organization: string;
    startDate: number;
    endDate?: number;
    description?: string;
    order: number;
    published: boolean;
    url?: string;
    logoStorageId?: string;
    stack?: string[];
    projects?: { name: string; url?: string; imageStorageId?: string }[];
  }) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [values, setValues] = useState<ResumeItemFormValues>({
    ...EMPTY,
    ...initial,
  });

  function set<K extends keyof ResumeItemFormValues>(
    key: K,
    val: ResumeItemFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function setProject<K extends keyof SubProjectFormValue>(
    index: number,
    key: K,
    val: SubProjectFormValue[K],
  ) {
    setValues((v) => {
      const projects = [...v.projects];
      projects[index] = { ...projects[index], [key]: val };
      return { ...v, projects };
    });
  }

  function addProject() {
    setValues((v) => ({
      ...v,
      projects: [
        ...v.projects,
        { name: "", url: "", imageStorageId: undefined },
      ],
    }));
  }

  function removeProject(index: number) {
    setValues((v) => ({
      ...v,
      projects: v.projects.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      kind: values.kind,
      title: values.title,
      organization: values.organization,
      startDate: inputValueToDate(values.startDate),
      endDate:
        values.ongoing || !values.endDate
          ? undefined
          : inputValueToDate(values.endDate),
      description: values.description || undefined,
      order: Number(values.order) || 0,
      published: values.published,
      url: values.url || undefined,
      logoStorageId: values.logoStorageId || undefined,
      stack: values.stack ? values.stack.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      projects: values.projects
        .filter((p) => p.name.trim())
        .map((p) => ({
          name: p.name.trim(),
          url: p.url || undefined,
          imageStorageId: p.imageStorageId || undefined,
        })),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Field label="Type">
        <select
          value={values.kind}
          onChange={(e) =>
            set("kind", e.target.value as "experience" | "education")
          }
          className="input"
        >
          <option value="experience">Experience</option>
          <option value="education">Education</option>
        </select>
      </Field>
      <Field label="Title (role or degree)">
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Organization (company or school)">
        <input
          required
          value={values.organization}
          onChange={(e) => set("organization", e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Start date">
        <input
          type="date"
          required
          value={values.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          className="input"
        />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.ongoing}
          onChange={(e) => set("ongoing", e.target.checked)}
        />
        Ongoing / present
      </label>
      {!values.ongoing && (
        <Field label="End date">
          <input
            type="date"
            value={values.endDate}
            onChange={(e) => set("endDate", e.target.value)}
            className="input"
          />
        </Field>
      )}
      <Field label="Description">
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          className="input font-mono text-sm"
        />
      </Field>
      <Field label="Website / URL">
        <input
          type="url"
          value={values.url}
          onChange={(e) => set("url", e.target.value)}
          className="input"
          placeholder="https://example.com"
        />
      </Field>
      <ImageUploader
        label="Logo"
        value={values.logoStorageId}
        existingUrl={existingLogoUrl}
        onChange={(id) => set("logoStorageId", id)}
      />
      <Field label="Stack / Technologies (comma separated)">
        <input
          value={values.stack}
          onChange={(e) => set("stack", e.target.value)}
          className="input"
          placeholder="React, TypeScript, Node.js"
        />
      </Field>

      <div>
        <span className="block font-mono text-xs uppercase tracking-wide text-ink-soft">
          Projects (during this role)
        </span>
        <div className="mt-2 flex flex-col gap-3">
          {values.projects.map((project, i) => (
            <div
              key={i}
              className="panel-sm flex flex-col gap-2 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-soft">
                  Project {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeProject(i)}
                  className="text-xs text-accent"
                >
                  Remove
                </button>
              </div>
              <input
                required
                value={project.name}
                onChange={(e) => setProject(i, "name", e.target.value)}
                className="input"
                placeholder="Project name"
              />
              <input
                type="url"
                value={project.url}
                onChange={(e) => setProject(i, "url", e.target.value)}
                className="input"
                placeholder="https://example.com (optional)"
              />
              <ImageUploader
                label="Image"
                value={project.imageStorageId}
                existingUrl={project.existingImageUrl}
                onChange={(id) => setProject(i, "imageStorageId", id)}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addProject}
          className="btn mt-3 px-3 py-1.5 text-sm"
        >
          + Add project
        </button>
      </div>

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
