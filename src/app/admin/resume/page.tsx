"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { ResumeItemForm } from "@/components/admin/forms/ResumeItemForm";
import { dateToInputValue, formatMonthYear } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminResumePage() {
  const { token } = useAdminSession();
  const items = useQuery(
    api.resumeItems.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.resumeItems.create);
  const update = useMutation(api.resumeItems.update);
  const togglePublish = useMutation(api.resumeItems.togglePublish);
  const remove = useMutation(api.resumeItems.remove);

  const [editingId, setEditingId] = useState<
    Id<"resumeItems"> | "new" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || items === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? items.find((i) => i._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Resume Item" : "Edit Resume Item"}
        </h1>
        <div className="mt-6">
          <ResumeItemForm
            initial={
              editing
                ? {
                    kind: editing.kind,
                    title: editing.title,
                    organization: editing.organization,
                    startDate: dateToInputValue(editing.startDate),
                    endDate: editing.endDate
                      ? dateToInputValue(editing.endDate)
                      : "",
                    ongoing: !editing.endDate,
                    description: editing.description ?? "",
                    order: editing.order.toString(),
                    published: editing.published,
                    url: editing.url ?? "",
                    logoStorageId: editing.logoStorageId,
                    stack: editing.stack ? editing.stack.join(", ") : "",
                  }
                : undefined
            }
            existingLogoUrl={editing?.logoUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const logoStorageId = values.logoStorageId as Id<"_storage"> | undefined;
                if (editingId === "new") {
                  await create({ token, ...values, logoStorageId });
                } else {
                  await update({ token, id: editingId, ...values, logoStorageId });
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
        <h1 className="font-heading text-2xl text-ink">
          Experience &amp; Education
        </h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="rounded-sm bg-accent px-3 py-1.5 text-sm text-paper"
        >
          New Item
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between rounded-sm border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-ink">
                {item.title} — {item.organization}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {item.kind} · {formatMonthYear(item.startDate)} –{" "}
                {item.endDate ? formatMonthYear(item.endDate) : "Present"} ·{" "}
                {item.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: item._id,
                    published: !item.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {item.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(item._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${item.title}"?`)) {
                    remove({ token, id: item._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-ink-soft">No items yet.</p>
        )}
      </div>
    </div>
  );
}
