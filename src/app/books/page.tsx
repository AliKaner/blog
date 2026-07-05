import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { FeedCard } from "@/components/feed/FeedCard";

export default async function BooksPage() {
  const books = await fetchQuery(api.books.list, {});

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Books</h1>
      <div className="mt-8 flex flex-col gap-4">
        {books.length === 0 && (
          <p className="text-ink-soft">No books logged yet.</p>
        )}
        {books.map((b) => (
          <FeedCard
            key={b._id}
            type="book"
            slug={b.slug}
            title={b.author ? `${b.title} — ${b.author}` : b.title}
            date={b.finishedAt}
            rating={b.rating}
            imageUrl={b.coverUrl}
          />
        ))}
      </div>
    </div>
  );
}
