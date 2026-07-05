"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { PostForm } from "@/components/admin/forms/PostForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminPostsPage() {
  const { token } = useAdminSession();
  const posts = useQuery(api.posts.listAllAdmin, token ? { token } : "skip");
  const create = useMutation(api.posts.create);
  const update = useMutation(api.posts.update);
  const togglePublish = useMutation(api.posts.togglePublish);
  const remove = useMutation(api.posts.remove);

  const [editingId, setEditingId] = useState<Id<"posts"> | "new" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || posts === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? posts.find((p) => p._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Post" : "Edit Post"}
        </h1>
        <div className="mt-6">
          <PostForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    body: editing.body,
                    coverStorageId: editing.coverStorageId,
                    publishedAt: dateToInputValue(editing.publishedAt),
                    published: editing.published,
                  }
                : undefined
            }
            existingCoverUrl={editing?.coverUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const coverStorageId = values.coverStorageId as
                  | Id<"_storage">
                  | undefined;
                if (editingId === "new") {
                  await create({ token, ...values, coverStorageId });
                } else {
                  await update({
                    token,
                    id: editingId,
                    ...values,
                    coverStorageId,
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
        <h1 className="font-heading text-2xl text-ink">Posts</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="rounded-sm bg-accent px-3 py-1.5 text-sm text-paper"
        >
          New Post
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {posts.map((p) => (
          <div
            key={p._id}
            className="flex items-center justify-between rounded-sm border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-ink">{p.title}</p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(p.publishedAt)} ·{" "}
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
                  if (confirm(`Delete "${p.title}"?`)) {
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
        {posts.length === 0 && <p className="text-ink-soft">No posts yet.</p>}
      </div>
    </div>
  );
}
