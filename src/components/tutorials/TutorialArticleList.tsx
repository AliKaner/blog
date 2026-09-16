import Link from "next/link";
import { formatDate } from "@/lib/format";

type Article = {
  _id: string;
  title: string;
  slug: string;
  body?: string | null;
  videoUrl?: string | null;
  videoFileUrl?: string | null;
  coverUrl?: string | null;
  publishedAt: number;
};

export function TutorialArticleList({
  topicSlug,
  articles,
}: {
  topicSlug: string;
  articles: Article[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {articles.map((article) => {
        const isVideo = Boolean(article.videoUrl || article.videoFileUrl);
        return (
          <Link
            key={article._id}
            href={`/tutorials/${topicSlug}/${article.slug}`}
            className="panel flex gap-4 p-4 no-underline"
          >
            {article.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.coverUrl}
                alt=""
                className="h-20 w-28 shrink-0 rounded-sm border border-border object-cover"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wide text-accent">
                <span>{isVideo ? "▶ Video" : "Article"}</span>
                <span className="text-ink-soft">·</span>
                <span className="text-ink-soft">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
              <h3 className="mt-1 truncate font-heading text-lg text-ink">
                {article.title}
              </h3>
              {article.body && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-soft">
                  {article.body.slice(0, 160)}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
