"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "../../../../../convex/_generated/api";
import { useAdminSession } from "@/components/providers/AdminSessionProvider";
import { TutorialArticleForm } from "@/components/admin/forms/TutorialArticleForm";
import { formatDate, dateToInputValue } from "@/lib/format";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function AdminTutorialTopicArticlesPage() {
  const { token } = useAdminSession();
  const params = useParams<{ topicId: string }>();
  const topicId = params.topicId as Id<"tutorialTopics">;

  const topics = useQuery(
    api.tutorials.topics.listAllAdmin,
    token ? { token } : "skip",
  );
  const articles = useQuery(
    api.tutorials.articles.listAllAdminByTopic,
    token ? { token, topicId } : "skip",
  );
  const create = useMutation(api.tutorials.articles.create);
  const update = useMutation(api.tutorials.articles.update);
  const togglePublish = useMutation(api.tutorials.articles.togglePublish);
  const remove = useMutation(api.tutorials.articles.remove);

  const [editingId, setEditingId] = useState<
    Id<"tutorialArticles"> | "new" | null
  >(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!token || topics === undefined || articles === undefined) {
    return <p>Loading…</p>;
  }

  const topic = topics.find((t) => t._id === topicId);
  if (!topic) return <p className="text-ink-soft">Topic not found.</p>;

  const editing =
    editingId && editingId !== "new"
      ? articles.find((a) => a._id === editingId)
      : undefined;

  if (editingId) {
    return (
      <div>
        <Link
          href="/admin/tutorials"
          className="font-mono text-xs uppercase tracking-wide text-accent no-underline"
        >
          ← {topic.title}
        </Link>
        <h1 className="mt-2 font-heading text-2xl text-ink">
          {editingId === "new" ? "New Article" : "Edit Article"}
        </h1>
        <div className="mt-6">
          <TutorialArticleForm
            initial={
              editing
                ? {
                    title: editing.title,
                    slug: editing.slug,
                    body: editing.body ?? "",
                    videoUrl: editing.videoUrl ?? "",
                    videoStorageId: editing.videoStorageId,
                    coverStorageId: editing.coverStorageId,
                    order: editing.order.toString(),
                    publishedAt: dateToInputValue(editing.publishedAt),
                    published: editing.published,
                  }
                : undefined
            }
            existingCoverUrl={editing?.coverUrl}
            existingVideoFileUrl={editing?.videoFileUrl}
            submitting={submitting}
            onCancel={() => {
              setFormError(null);
              setEditingId(null);
            }}
            onSubmit={async (values) => {
              setSubmitting(true);
              setFormError(null);
              try {
                const videoStorageId = values.videoStorageId as
                  | Id<"_storage">
                  | undefined;
                const coverStorageId = values.coverStorageId as
                  | Id<"_storage">
                  | undefined;
                if (editingId === "new") {
                  await create({
                    token,
                    topicId,
                    ...values,
                    videoStorageId,
                    coverStorageId,
                  });
                } else {
                  await update({
                    token,
                    id: editingId,
                    topicId,
                    ...values,
                    videoStorageId,
                    coverStorageId,
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
      <Link
        href="/admin/tutorials"
        className="font-mono text-xs uppercase tracking-wide text-accent no-underline"
      >
        ← All topics
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-ink">{topic.title}</h1>
        <button
          onClick={() => {
            setFormError(null);
            setEditingId("new");
          }}
          className="btn px-3 py-1.5 text-sm"
        >
          New Article
        </button>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {articles.map((article) => (
          <div
            key={article._id}
            className="panel-sm flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-ink">
                {article.title}{" "}
                {(article.videoUrl || article.videoFileUrl) && (
                  <span className="text-accent-2">▶</span>
                )}
              </p>
              <p className="font-mono text-xs text-ink-soft">
                {formatDate(article.publishedAt)} ·{" "}
                {article.published ? "published" : "draft"}
              </p>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                onClick={() =>
                  togglePublish({
                    token,
                    id: article._id,
                    published: !article.published,
                  })
                }
                className="text-ink-soft hover:text-ink"
              >
                {article.published ? "Unpublish" : "Publish"}
              </button>
              <button
                onClick={() => {
                  setFormError(null);
                  setEditingId(article._id);
                }}
                className="text-ink-soft hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete "${article.title}"?`)) {
                    remove({ token, id: article._id });
                  }
                }}
                className="text-accent"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {articles.length === 0 && (
          <p className="text-ink-soft">No articles in this topic yet.</p>
        )}
      </div>
    </div>
  );
}
