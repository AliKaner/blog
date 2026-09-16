import Link from "next/link";

type Topic = {
  _id: string;
  title: string;
  slug: string;
  description?: string | null;
  articleCount: number;
};

export function TopicsGrid({ topics }: { topics: Topic[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {topics.map((topic) => (
        <Link
          key={topic._id}
          href={`/tutorials/${topic.slug}`}
          className="no-underline"
        >
          <div className="panel flex h-full flex-col gap-2 p-5">
            <p className="font-heading text-xl text-ink">{topic.title}</p>
            {topic.description && (
              <p className="text-sm text-ink-soft">{topic.description}</p>
            )}
            <p className="mt-auto pt-2 font-mono text-xs uppercase tracking-wide text-accent">
              {topic.articleCount}{" "}
              {topic.articleCount === 1 ? "entry" : "entries"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
