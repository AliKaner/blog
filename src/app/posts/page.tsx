import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { JourneyTimeline } from "@/components/feed/JourneyTimeline";

export default async function PostsPage() {
  const posts = await fetchQuery(api.posts.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Posts</h1>
      <div className="mt-8">
        {posts.length === 0 ? (
          <p className="text-ink-soft">No posts yet.</p>
        ) : (
          <JourneyTimeline
            items={posts.map((p) => ({
              type: "post" as const,
              id: p._id,
              slug: p.slug,
              title: p.title,
              date: p.publishedAt,
              excerpt: p.body.slice(0, 160),
              imageUrl: p.coverUrl,
            }))}
          />
        )}
      </div>
    </div>
  );
}
