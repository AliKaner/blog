import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { FeedCard } from "@/components/feed/FeedCard";

export default async function PostsPage() {
  const posts = await fetchQuery(api.posts.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Posts</h1>
      <div className="mt-8 flex flex-col gap-4">
        {posts.length === 0 && (
          <p className="text-ink-soft">No posts yet.</p>
        )}
        {posts.map((p) => (
          <FeedCard
            key={p._id}
            type="post"
            slug={p.slug}
            title={p.title}
            date={p.publishedAt}
            excerpt={p.body.slice(0, 160)}
            imageUrl={p.coverUrl}
          />
        ))}
      </div>
    </div>
  );
}
