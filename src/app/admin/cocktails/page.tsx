"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { CocktailForm } from "@/components/admin/forms/CocktailForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminCocktailsPage() {
  const { token } = useAdminSession();
  const cocktails = useQuery(
    api.cocktails.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.cocktails.create);
  const update = useMutation(api.cocktails.update);
  const togglePublish = useMutation(api.cocktails.togglePublish);
  const remove = useMutation(api.cocktails.remove);

  const [editingId, setEditingId] = useState<Id<"cocktails"> | "new" | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || cocktails === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? cocktails.find((c) => c._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Cocktail" : "Edit Cocktail"}
        </h1>
        <div className="mt-6">
          <CocktailForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    baseSpirit: editing.baseSpirit ?? "",
                    ingredients: (editing.ingredients ?? []).join("\n"),
                    rating: editing.rating?.toString() ?? "",
                    review: editing.review ?? "",
                    imageStorageId: editing.imageStorageId,
                    triedAt: dateToInputValue(editing.triedAt),
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
                const imageStorageId = values.imageStorageId as
                  | Id<"_storage">
                  | undefined;
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
        <h1 className="font-heading text-2xl text-ink">Cocktails</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Cocktail
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {cocktails.map((c) => (
          <div
            key={c._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-ink">
                {c.title} {c.baseSpirit ? `· ${c.baseSpirit}` : ""}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(c.triedAt)} ·{" "}
                {c.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: c._id,
                    published: !c.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {c.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(c._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${c.title}"?`)) {
                    remove({ token, id: c._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {cocktails.length === 0 && (
          <p className="text-ink-soft">No cocktails yet.</p>
        )}
      </div>
    </div>
  );
}
