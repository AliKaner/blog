"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { MovieForm } from "@/components/admin/forms/MovieForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminMoviesPage() {
  const { token } = useAdminSession();
  const movies = useQuery(
    api.movies.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.movies.create);
  const update = useMutation(api.movies.update);
  const togglePublish = useMutation(api.movies.togglePublish);
  const remove = useMutation(api.movies.remove);

  const [editingId, setEditingId] = useState<Id<"movies"> | "new" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || movies === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? movies.find((m) => m._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Movie" : "Edit Movie"}
        </h1>
        <div className="mt-6">
          <MovieForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    year: editing.year?.toString() ?? "",
                    rating: editing.rating?.toString() ?? "",
                    review: editing.review ?? "",
                    posterStorageId: editing.posterStorageId,
                    watchedAt: dateToInputValue(editing.watchedAt),
                    published: editing.published,
                  }
                : undefined
            }
            existingPosterUrl={editing?.posterUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const posterStorageId = values.posterStorageId as
                  | Id<"_storage">
                  | undefined;
                if (editingId === "new") {
                  await create({ token, ...values, posterStorageId });
                } else {
                  await update({
                    token,
                    id: editingId,
                    ...values,
                    posterStorageId,
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
        <h1 className="font-heading text-2xl text-ink">Movies</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Movie
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {movies.map((m) => (
          <div
            key={m._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-ink">
                {m.title} {m.year ? `(${m.year})` : ""}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(m.watchedAt)} ·{" "}
                {m.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: m._id,
                    published: !m.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {m.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(m._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${m.title}"?`)) {
                    remove({ token, id: m._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {movies.length === 0 && (
          <p className="text-ink-soft">No movies yet.</p>
        )}
      </div>
    </div>
  );
}
