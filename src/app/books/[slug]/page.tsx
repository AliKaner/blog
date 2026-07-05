import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = await fetchQuery(api.books.getBySlug, { slug });
  if (!book) notFound();

  return (
    <article>
      <div className="flex gap-6">
        {book.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-48 w-32 shrink-0 rounded-sm border border-border object-cover"
          />
        )}
        <div>
          <div className="font-mono text-xs uppercase tracking-wide text-accent">
            Book · {formatDate(book.finishedAt)}
          </div>
          <h1 className="mt-1 font-heading text-3xl text-ink">
            {book.title}
          </h1>
          {book.author && <p className="mt-1 text-ink-soft">{book.author}</p>}
          {typeof book.rating === "number" && (
            <p className="mt-2 text-ink-soft">{book.rating}/10</p>
          )}
        </div>
      </div>
      {book.review && (
        <div className="mt-8">
          <Markdown>{book.review}</Markdown>
        </div>
      )}
    </article>
  );
}
