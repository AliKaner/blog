import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { FeedCard } from "@/components/feed/FeedCard";

export default async function MoviesPage() {
  const movies = await fetchQuery(api.movies.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Movies</h1>
      <div className="mt-8 flex flex-col gap-4">
        {movies.length === 0 && (
          <p className="text-ink-soft">No movies logged yet.</p>
        )}
        {movies.map((m) => (
          <FeedCard
            key={m._id}
            type="movie"
            slug={m.slug}
            title={m.year ? `${m.title} (${m.year})` : m.title}
            date={m.watchedAt}
            rating={m.rating}
            imageUrl={m.posterUrl}
          />
        ))}
      </div>
    </div>
  );
}
