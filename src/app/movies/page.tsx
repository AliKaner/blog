import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { JourneyTimeline } from "@/components/feed/JourneyTimeline";

export default async function MoviesPage() {
  const movies = await fetchQuery(api.movies.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Movies</h1>
      <div className="mt-8">
        {movies.length === 0 ? (
          <p className="text-ink-soft">No movies logged yet.</p>
        ) : (
          <JourneyTimeline
            items={movies.map((m) => ({
              type: "movie" as const,
              id: m._id,
              slug: m.slug,
              title: m.year ? `${m.title} (${m.year})` : m.title,
              date: m.watchedAt,
              rating: m.rating,
              imageUrl: m.posterUrl,
            }))}
          />
        )}
      </div>
    </div>
  );
}
