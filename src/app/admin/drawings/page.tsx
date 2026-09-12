"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { DrawingForm } from "@/components/admin/forms/DrawingForm";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminDrawingsPage() {
  const { token } = useAdminSession();
  const drawings = useQuery(
    api.drawings.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.drawings.create);
  const update = useMutation(api.drawings.update);
  const togglePublish = useMutation(api.drawings.togglePublish);
  const remove = useMutation(api.drawings.remove);

  const [editingId, setEditingId] = useState<Id<"drawings"> | "new" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || drawings === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? drawings.find((d) => d._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Drawing" : "Edit Drawing"}
        </h1>
        <div className="mt-6">
          <DrawingForm
            initial={
              editing
                ? {
                    title: editing.title ?? "",
                    imageStorageId: editing.imageStorageId,
                    order: editing.order.toString(),
                    published: editing.published,
                  }
                : undefined
            }
            existingImageUrl={editing?.imageUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const imageStorageId = values.imageStorageId as Id<"_storage">;
                if (editingId === "new") {
                  await create({ token, ...values, imageStorageId });
                } else {
                  await update({
                    token,
                    id: editingId,
                    ...values,
                    imageStorageId,
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
        <h1 className="font-heading text-2xl text-ink">Drawings</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Drawing
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {drawings.map((drawing) => (
          <div
            key={drawing._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {drawing.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={drawing.imageUrl}
                  alt=""
                  className="h-12 w-12 rounded-sm border border-border object-cover"
                />
              )}
              <div>
                <p className="text-ink">{drawing.title || "Untitled"}</p>
                <p className="font-mono text-xs text-ink-soft">
                  {drawing.published ? "published" : "draft"}
                </p>
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: drawing._id,
                    published: !drawing.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {drawing.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(drawing._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${drawing.title || "this drawing"}"?`)) {
                    remove({ token, id: drawing._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {drawings.length === 0 && (
          <p className="text-ink-soft">No drawings yet.</p>
        )}
      </div>
    </div>
  );
}
