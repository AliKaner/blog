import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";
import { ZoomableImage } from "@/components/ui/Lightbox";
import { VideoPlayer } from "@/components/tutorials/VideoPlayer";

export default async function TutorialArticlePage({
  params,
}: {
  params: Promise<{ articleSlug: string }>;
}) {
  const { articleSlug } = await params;
  const article = await fetchQuery(api.tutorials.articles.getBySlug, {
    slug: articleSlug,
  });
  if (!article) notFound();

  const hasVideo = Boolean(article.videoUrl || article.videoFileUrl);

  return (
    <article>
      <Link
        href={`/tutorials/${article.topic.slug}`}
        className="font-mono text-xs uppercase tracking-wide text-accent no-underline"
      >
        ← {article.topic.title}
      </Link>
      <h1 className="mt-2 font-heading text-3xl text-ink">{article.title}</h1>
      <div className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-soft">
        {formatDate(article.publishedAt)}
      </div>

      {hasVideo ? (
        <div className="mt-6">
          <VideoPlayer
            videoUrl={article.videoUrl}
            videoFileUrl={article.videoFileUrl}
          />
        </div>
      ) : (
        article.coverUrl && (
          <ZoomableImage
            src={article.coverUrl}
            alt={article.title}
            className="mt-6 w-full rounded-sm border border-border object-cover"
          />
        )
      )}

      {article.body && (
        <div className="mt-8">
          <Markdown>{article.body}</Markdown>
        </div>
      )}
    </article>
  );
}
