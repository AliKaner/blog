"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { AdminListControls, AdminLoadMore, type AdminStatus } from "@/components/admin/AdminListControls";
import { BulkImport } from "@/components/admin/BulkImport";
import { PublishAllButtons } from "@/components/admin/PublishAllButtons";
import { MovieForm } from "@/components/admin/forms/MovieForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

const ADMIN_PAGE = 50;

export default function AdminMoviesPage() {
  const { token } = useAdminSession();
  const [status, setStatus] = useState<AdminStatus>("all");
  const [search, setSearch] = useState("");
  // Paginated: the table can hold thousands of films.
  const { results: movies, status: listStatus, loadMore } = usePaginatedQuery(
    api.movies.pageAdmin,
    token ? { token, status, ...(search ? { search } : {}) } : "skip",
    { initialNumItems: ADMIN_PAGE },
  );
  const create = useMutation(api.movies.create);
  const update = useMutation(api.movies.update);
  const togglePublish = useMutation(api.movies.togglePublish);
  const remove = useMutation(api.movies.remove);

  const [editingId, setEditingId] = useState<Id<"movies"> | "new" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The full record (review, poster) is fetched only for the one being edited.
  const editing = useQuery(
    api.movies.getAdmin,
    token && editingId && editingId !== "new" ? { token, id: editingId } : "skip",
  );

  if (!token) return <p>Loading…</p>;

  if (editingId) {
    if (editingId !== "new" && editing === undefined) return <p>Loading…</p>;
    const record = editingId !== "new" ? editing : null;
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">{editingId === "new" ? "New Movie" : "Edit Movie"}</h1>
        <div className="mt-6">
          <MovieForm
            initial={
              record
                ? {
                    title: record.title,
                    slug: record.slug,
                    year: record.year?.toString() ?? "",
                    rating: record.rating?.toString() ?? "",
                    review: record.review ?? "",
                    posterStorageId: record.posterStorageId,
                    watchedAt: dateToInputValue(record.watchedAt),
                    published: record.published,
                  }
                : undefined
            }
            existingPosterUrl={record?.posterUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const posterStorageId = values.posterStorageId as Id<"_storage"> | undefined;
                if (editingId === "new") {
                  await create({ token, ...values, posterStorageId });
                } else {
                  await update({ token, id: editingId, ...values, posterStorageId });
                }
                setEditingId(null);
              } catch (e) {
                setFormError(e instanceof Error ? e.message : "Couldn't save.");
              } finally {
                setSubmitting(false);
              }
            }}
          />
          {formError && <p className="mt-3 max-w-md text-sm text-accent">{formError}</p>}
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
      <div className="mt-4">
        <PublishAllButtons kind="movies" />
      </div>
      <BulkImport kind="movies" />
      <AdminListControls noun="movies" status={status} onStatus={setStatus} onSearch={setSearch} />
      <div className="mt-4 flex flex-col gap-2">
        {listStatus === "LoadingFirstPage" && <p className="text-ink-soft">Loading…</p>}
        {movies.map((m) => (
          <div key={m._id} className="panel-sm flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-ink">
                {m.title} {m.year ? `(${m.year})` : ""}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(m.watchedAt)} · {m.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => togglePublish({ token, id: m._id, published: !m.published })}
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
                  if (confirm(`Delete "${m.title}"?`)) remove({ token, id: m._id });
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {listStatus !== "LoadingFirstPage" && movies.length === 0 && (
          <p className="text-ink-soft">{search || status !== "all" ? "Nothing matches." : "No movies yet."}</p>
        )}
      </div>
      <AdminLoadMore status={listStatus} count={movies.length} onMore={() => loadMore(ADMIN_PAGE)} />
    </div>
  );
}
