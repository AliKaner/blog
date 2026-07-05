"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { SoftwareLogForm } from "@/components/admin/forms/SoftwareLogForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminDevLogPage() {
  const { token } = useAdminSession();
  const logs = useQuery(
    api.softwareLogs.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.softwareLogs.create);
  const update = useMutation(api.softwareLogs.update);
  const togglePublish = useMutation(api.softwareLogs.togglePublish);
  const remove = useMutation(api.softwareLogs.remove);

  const [editingId, setEditingId] = useState<
    Id<"softwareLogs"> | "new" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || logs === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? logs.find((l) => l._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Dev Log Entry" : "Edit Dev Log Entry"}
        </h1>
        <div className="mt-6">
          <SoftwareLogForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    body: editing.body,
                    tags: editing.tags?.join(", ") ?? "",
                    loggedAt: dateToInputValue(editing.loggedAt),
                    published: editing.published,
                  }
                : undefined
            }
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                if (editingId === "new") {
                  await create({ token, ...values });
                } else {
                  await update({ token, id: editingId, ...values });
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
        <h1 className="font-heading text-2xl text-ink">Dev Log</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Entry
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {logs.map((l) => (
          <div
            key={l._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-ink">{l.title}</p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(l.loggedAt)} ·{" "}
                {l.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: l._id,
                    published: !l.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {l.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(l._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${l.title}"?`)) {
                    remove({ token, id: l._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {logs.length === 0 && <p className="text-ink-soft">No entries yet.</p>}
      </div>
    </div>
  );
}
