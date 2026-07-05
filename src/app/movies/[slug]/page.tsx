import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const movie = await fetchQuery(api.movies.getBySlug, { slug });
  if (!movie) notFound();

  return (
    <article>
      <div className="flex gap-6">
        {movie.posterUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-48 w-32 shrink-0 rounded-sm border border-border object-cover"
          />
        )}
        <div>
          <div className="font-mono text-xs uppercase tracking-wide text-accent">
            Movie · {formatDate(movie.watchedAt)}
          </div>
          <h1 className="mt-1 font-heading text-3xl text-ink">
            {movie.title}
            {movie.year ? ` (${movie.year})` : ""}
          </h1>
          {typeof movie.rating === "number" && (
            <p className="mt-2 text-ink-soft">{movie.rating}/10</p>
          )}
        </div>
      </div>
      {movie.review && (
        <div className="mt-8">
          <Markdown>{movie.review}</Markdown>
        </div>
      )}
    </article>
  );
}
