import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { FeedCard } from "@/components/feed/FeedCard";

export default async function HomePage() {
  const feed = await fetchQuery(api.feed.getFeed, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">The Journey</h1>
      <p className="mt-2 text-ink-soft">
        Movies watched, places visited, books read, and everything else along
        the way.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {feed.length === 0 && (
          <p className="text-ink-soft">Nothing published yet — check back soon.</p>
        )}
        {feed.map((item) => (
          <FeedCard key={`${item.type}-${item.id}`} {...item} />
        ))}
      </div>
    </div>
  );
}
