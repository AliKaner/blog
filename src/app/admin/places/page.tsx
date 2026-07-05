"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { PlaceForm } from "@/components/admin/forms/PlaceForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminPlacesPage() {
  const { token } = useAdminSession();
  const places = useQuery(
    api.places.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.places.create);
  const update = useMutation(api.places.update);
  const togglePublish = useMutation(api.places.togglePublish);
  const remove = useMutation(api.places.remove);

  const [editingId, setEditingId] = useState<Id<"places"> | "new" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || places === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? places.find((p) => p._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Place" : "Edit Place"}
        </h1>
        <div className="mt-6">
          <PlaceForm
            initial={
              editing
                ? {
                    name: editing.name,
                    slug: editing.slug,
                    country: editing.country ?? "",
                    description: editing.description ?? "",
                    photoStorageIds: editing.photoStorageIds ?? [],
                    visitedAt: dateToInputValue(editing.visitedAt),
                    published: editing.published,
                  }
                : undefined
            }
            existingPhotoUrls={editing?.photoUrls}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const photoStorageIds = values.photoStorageIds as Id<"_storage">[];
                if (editingId === "new") {
                  await create({ token, ...values, photoStorageIds });
                } else {
                  await update({
                    token,
                    id: editingId,
                    ...values,
                    photoStorageIds,
                  });
                }
                setEditingId(null);
              } catch (e) {
                setFormError(e instanceof Error ? e.message : "Couldn't save.");
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
        <h1 className="font-heading text-2xl text-ink">Places</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="rounded-sm bg-accent px-3 py-1.5 text-sm text-paper"
        >
          New Place
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {places.map((p) => (
          <div
            key={p._id}
            className="flex items-center justify-between rounded-sm border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-ink">
                {p.name} {p.country ? `(${p.country})` : ""}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(p.visitedAt)} ·{" "}
                {p.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: p._id,
                    published: !p.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {p.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(p._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${p.name}"?`)) {
                    remove({ token, id: p._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {places.length === 0 && (
          <p className="text-ink-soft">No places yet.</p>
        )}
      </div>
    </div>
  );
}
