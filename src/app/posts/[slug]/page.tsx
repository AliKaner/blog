import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Markdown } from "@/components/Markdown";
import { formatDate } from "@/lib/format";

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchQuery(api.posts.getBySlug, { slug });
  if (!post) notFound();

  return (
    <article>
      <div className="font-mono text-xs uppercase tracking-wide text-accent">
        Post · {formatDate(post.publishedAt)}
      </div>
      <h1 className="mt-1 font-heading text-3xl text-ink">{post.title}</h1>
      {post.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverUrl}
          alt=""
          className="mt-6 w-full rounded-sm border border-border object-cover"
        />
      )}
      <div className="mt-8">
        <Markdown>{post.body}</Markdown>
      </div>
    </article>
  );
}
