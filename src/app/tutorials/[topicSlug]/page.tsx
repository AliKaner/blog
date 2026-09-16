import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../convex/_generated/api";
import { TutorialArticleList } from "@/components/tutorials/TutorialArticleList";

export default async function TutorialTopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const data = await fetchQuery(api.tutorials.articles.listByTopic, {
    topicSlug,
  });
  if (!data) notFound();
  const { topic, articles } = data;

  return (
    <div>
      <Link
        href="/tutorials"
        className="font-mono text-xs uppercase tracking-wide text-accent no-underline"
      >
        ← Tutorials
      </Link>
      <h1 className="mt-2 font-heading text-3xl text-ink">{topic.title}</h1>
      {topic.description && (
        <p className="mt-2 text-ink-soft">{topic.description}</p>
      )}
      <div className="mt-8">
        {articles.length === 0 ? (
          <p className="text-ink-soft">Nothing here yet.</p>
        ) : (
          <TutorialArticleList topicSlug={topic.slug} articles={articles} />
        )}
      </div>
    </div>
  );
}
