"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { ProjectForm } from "@/components/admin/forms/ProjectForm";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminProjectsPage() {
  const { token } = useAdminSession();
  const projects = useQuery(
    api.projects.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.projects.create);
  const update = useMutation(api.projects.update);
  const togglePublish = useMutation(api.projects.togglePublish);
  const remove = useMutation(api.projects.remove);

  const [editingId, setEditingId] = useState<Id<"projects"> | "new" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || projects === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? projects.find((p) => p._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Project" : "Edit Project"}
        </h1>
        <div className="mt-6">
          <ProjectForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    description: editing.description ?? "",
                    imageStorageIds: editing.imageStorageIds ?? [],
                    url: editing.url ?? "",
                    order: editing.order.toString(),
                    published: editing.published,
                  }
                : undefined
            }
            existingImageUrls={editing?.imageUrls}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const imageStorageIds = values.imageStorageIds as Id<"_storage">[];
                if (editingId === "new") {
                  await create({ token, ...values, imageStorageIds });
                } else {
                  await update({
                    token,
                    id: editingId,
                    ...values,
                    imageStorageIds,
                  });
                }
                setEditingId(null);
              } catch (e) {
                setFormError(
                  e instanceof Error ? e.message : "Couldn't save.",
                );
              } finally {
                setSubmitting(false);
              }
            }}
          />
          {formError && (
            <p className="mt-3 max-w-md text-sm text-accent">{formError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl text-ink">Projects</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="rounded-sm bg-accent px-3 py-1.5 text-sm text-paper"
        >
          New Project
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {projects.map((project) => (
          <div
            key={project._id}
            className="flex items-center justify-between rounded-sm border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-ink">{project.title}</p>
              <p className="font-mono text-xs text-ink-soft">
                {project.published ? "published" : "draft"}
                {project.url ? ` · ${project.url}` : ""}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: project._id,
                    published: !project.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {project.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(project._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${project.title}"?`)) {
                    remove({ token, id: project._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-ink-soft">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
