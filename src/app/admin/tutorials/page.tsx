"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { TutorialTopicForm } from "@/components/admin/forms/TutorialTopicForm";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function AdminTutorialsPage() {
  const { token } = useAdminSession();
  const topics = useQuery(
    api.tutorials.topics.listAllAdmin,
    token ? { token } : "skip",
  );
  const create = useMutation(api.tutorials.topics.create);
  const update = useMutation(api.tutorials.topics.update);
  const togglePublish = useMutation(api.tutorials.topics.togglePublish);
  const remove = useMutation(api.tutorials.topics.remove);

  const [editingId, setEditingId] = useState<
    Id<"tutorialTopics"> | "new" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || topics === undefined) return <p>Loading…</p>;

  const editing =
    editingId && editingId !== "new"
      ? topics.find((t) => t._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <h1 className="font-heading text-2xl text-ink">
          {editingId === "new" ? "New Topic" : "Edit Topic"}
        </h1>
        <div className="mt-6">
          <TutorialTopicForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    description: editing.description ?? "",
                    order: editing.order.toString(),
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
        <h1 className="font-heading text-2xl text-ink">Tutorials</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Topic
        </button>
      </div>
      <p className="mt-2 text-sm text-ink-soft">
        Topics group tutorial entries — e.g. &quot;Videos&quot; or
        &quot;Tutorials&quot;. Open a topic to add articles to it.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {topics.map((topic) => (
          <div
            key={topic._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-ink">{topic.title}</p>
              <p className="font-mono text-xs text-ink-soft">
                {topic.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <Link
                href={`/admin/tutorials/${topic._id}`}
                className="text-ink-soft hover:text-ink"
              >
                Articles →
              </Link>
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: topic._id,
                    published: !topic.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {topic.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(topic._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Delete "${topic.title}" and all of its articles?`,
                    )
                  ) {
                    remove({ token, id: topic._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {topics.length === 0 && (
          <p className="text-ink-soft">No topics yet.</p>
        )}
      </div>
    </div>
  );
}
