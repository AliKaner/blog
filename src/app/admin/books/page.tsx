"use client";

import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { AdminListControls, AdminLoadMore, type AdminStatus } from "@/components/admin/AdminListControls";
import { BulkImport } from "@/components/admin/BulkImport";
import { PublishAllButtons } from "@/components/admin/PublishAllButtons";
import { BookForm } from "@/components/admin/forms/BookForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

const ADMIN_PAGE = 50;

export default function AdminBooksPage() {
  const { token } = useAdminSession();
  const [status, setStatus] = useState<AdminStatus>("all");
  const [search, setSearch] = useState("");
  // Paginated: the table can hold thousands of books.
  const { results: books, status: listStatus, loadMore } = usePaginatedQuery(
    api.books.pageAdmin,
    token ? { token, status, ...(search ? { search } : {}) } : "skip",
    { initialNumItems: ADMIN_PAGE },
  );
  const create = useMutation(api.books.create);
  const update = useMutation(api.books.update);
  const togglePublish = useMutation(api.books.togglePublish);
  const remove = useMutation(api.books.remove);

  const [editingId, setEditingId] = useState<Id<"books"> | "new" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The full record (review, cover) is fetched only for the one being edited.
  const editing = useQuery(
    api.books.getAdmin,
    token && editingId && editingId !== "new" ? { token, id: editingId } : "skip",
  );

  if (!token) return <p>Loading…</p>;

  if (editingId) {
    if (editingId !== "new" && editing === undefined) return <p>Loading…</p>;
    const record = editingId !== "new" ? editing : null;
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">{editingId === "new" ? "New Book" : "Edit Book"}</h1>
        <div className="mt-6">
          <BookForm
            initial={
              record
                ? {
                    title: record.title,
                    slug: record.slug,
                    author: record.author ?? "",
                    rating: record.rating?.toString() ?? "",
                    review: record.review ?? "",
                    coverStorageId: record.coverStorageId,
                    finishedAt: dateToInputValue(record.finishedAt),
                    published: record.published,
                  }
                : undefined
            }
            existingCoverUrl={record?.coverUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const coverStorageId = values.coverStorageId as Id<"_storage"> | undefined;
                if (editingId === "new") {
                  await create({ token, ...values, coverStorageId });
                } else {
                  await update({ token, id: editingId, ...values, coverStorageId });
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
        <h1 className="font-heading text-2xl text-ink">Books</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Book
        </button>
      </div>
      <div className="mt-4">
        <PublishAllButtons kind="books" />
      </div>
      <BulkImport kind="books" />
      <AdminListControls noun="books" status={status} onStatus={setStatus} onSearch={setSearch} />
      <div className="mt-4 flex flex-col gap-2">
        {listStatus === "LoadingFirstPage" && <p className="text-ink-soft">Loading…</p>}
        {books.map((b) => (
          <div key={b._id} className="panel-sm flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-ink">
                {b.title}
                {b.author ? ` — ${b.author}` : ""}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(b.finishedAt)} · {b.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => togglePublish({ token, id: b._id, published: !b.published })}
                className="text-ink-soft hover:text-ink"
              >
                {b.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(b._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${b.title}"?`)) remove({ token, id: b._id });
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {listStatus !== "LoadingFirstPage" && books.length === 0 && (
          <p className="text-ink-soft">{search || status !== "all" ? "Nothing matches." : "No books yet."}</p>
        )}
      </div>
      <AdminLoadMore status={listStatus} count={books.length} onMore={() => loadMore(ADMIN_PAGE)} />
    </div>
  );
}
