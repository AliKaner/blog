import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";

export default async function DevLogEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const log = await fetchQuery(api.softwareLogs.getBySlug, { slug });
  if (!log) notFound();

  return (
    <article>
      <div className="font-mono text-xs uppercase tracking-wide text-accent">
        Dev Log · {formatDate(log.loggedAt)}
      </div>
      <h1 className="mt-1 font-heading text-3xl text-ink">{log.title}</h1>
      {log.tags && log.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 font-mono text-xs text-ink-soft">
          {log.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-sm border border-border px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-8">
        <Markdown>{log.body}</Markdown>
      </div>
    </article>
  );
}
