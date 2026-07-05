import { query } from "./_generated/server";

type FeedItem = {
  type: "movie" | "place" | "book" | "softwareLog" | "post";
  id: string;
  slug: string;
  title: string;
  date: number;
  excerpt?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
};

export const getFeed = query({
  args: {},
  handler: async (ctx): Promise<FeedItem[]> => {
    const [movies, places, books, logs, posts] = await Promise.all([
      ctx.db
        .query("movies")
        .withIndex("by_published_watchedAt", (q) => q.eq("published", true))
        .order("desc")
        .collect(),
      ctx.db
        .query("places")
        .withIndex("by_published_visitedAt", (q) => q.eq("published", true))
        .order("desc")
        .collect(),
      ctx.db
        .query("books")
        .withIndex("by_published_finishedAt", (q) => q.eq("published", true))
        .order("desc")
        .collect(),
      ctx.db
        .query("softwareLogs")
        .withIndex("by_published_loggedAt", (q) => q.eq("published", true))
        .order("desc")
        .collect(),
      ctx.db
        .query("posts")
        .withIndex("by_published_publishedAt", (q) => q.eq("published", true))
        .order("desc")
        .collect(),
    ]);

    const movieItems: FeedItem[] = await Promise.all(
      movies.map(async (m) => ({
        type: "movie" as const,
        id: m._id,
        slug: m.slug,
        title: m.title,
        date: m.watchedAt,
        rating: m.rating ?? null,
        imageUrl: m.posterStorageId
          ? await ctx.storage.getUrl(m.posterStorageId)
          : null,
      })),
    );

    const placeItems: FeedItem[] = await Promise.all(
      places.map(async (p) => ({
        type: "place" as const,
        id: p._id,
        slug: p.slug,
        title: p.name,
        date: p.visitedAt,
        excerpt: p.description ?? null,
        imageUrl: p.photoStorageIds?.[0]
          ? await ctx.storage.getUrl(p.photoStorageIds[0])
          : null,
      })),
    );

    const bookItems: FeedItem[] = await Promise.all(
      books.map(async (b) => ({
        type: "book" as const,
        id: b._id,
        slug: b.slug,
        title: b.title,
        date: b.finishedAt,
        rating: b.rating ?? null,
        imageUrl: b.coverStorageId
          ? await ctx.storage.getUrl(b.coverStorageId)
          : null,
      })),
    );

    const logItems: FeedItem[] = logs.map((l) => ({
      type: "softwareLog" as const,
      id: l._id,
      slug: l.slug,
      title: l.title,
      date: l.loggedAt,
      excerpt: l.body.slice(0, 200),
    }));

    const postItems: FeedItem[] = await Promise.all(
      posts.map(async (p) => ({
        type: "post" as const,
        id: p._id,
        slug: p.slug,
        title: p.title,
        date: p.publishedAt,
        excerpt: p.body.slice(0, 200),
        imageUrl: p.coverStorageId
          ? await ctx.storage.getUrl(p.coverStorageId)
          : null,
      })),
    );

    return [
      ...movieItems,
      ...placeItems,
      ...bookItems,
      ...logItems,
      ...postItems,
    ].sort((a, b) => b.date - a.date);
  },
});
